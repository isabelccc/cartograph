/**
 * **Customer / public shop API** — routes under `shopRouter` (mounted as `/store/v1/...`).
 *
 * Covers: catalog, carts, orders, checkout workflow, tax, payments, Stripe PaymentIntent, inventory.
 * Idempotent POSTs use `createRequireIdempotencyKeyForPost` + `withIdempotency` (see `http/idempotency-post.ts`).
 *
 * Deep dive: **`POST /carts`** uses `cartRepo` only (empty cart); **`POST .../lines`** uses `cartService.addLine` (rules).
 */
import { randomUUID } from "node:crypto";
import type { Router } from "express";
import { asyncHandler } from "../../../../../packages/api-rest/src/async-handler.js";
import { DomainError } from "../../../../../packages/domain-contracts/src/errors.js";
import {
  toCartId,
  toOrderId,
  toPaymentId,
  toProductId,
  toSessionId,
  toVariantId,
} from "../../../../../packages/domain-contracts/src/ids.js";
import type { Payment, PaymentStatus } from "../../../../../packages/modules/payment/payment.types.js";
import { runCheckoutWorkflow } from "../../../../../packages/workflows/src/checkout.workflow.js";
import { addStripeShopPaymentIntentPost } from "../../http/stripe.js";
import { readyHandler } from "../../http/ready.js";
import {
  createRequireIdempotencyKeyForPost,
  withIdempotency,
} from "../../http/idempotency-post.js";
import type { CreateAppOptions } from "../types.js";
import type { WiredDomain } from "../domain-wiring.js";
import { checkoutBodySchema } from "../schemas.js";

export type RegisterShopRoutesCtx = {
  readonly shopRouter: Router;
  readonly wired: WiredDomain;
  readonly options: CreateAppOptions;
};

export function registerShopRoutes(ctx: RegisterShopRoutesCtx): void {
  const { shopRouter, wired, options } = ctx;
  const {
    db,
    catalogService,
    cartRepo,
    cartService,
    orderService,
    inventoryService,
    taxService,
    paymentService,
    orderRepo,
  } = wired;

  shopRouter.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, surface: "store" });
  });
  shopRouter.get("/ready", asyncHandler(readyHandler));

  if (catalogService !== undefined) {
    shopRouter.get(
      "/catalog/products",
      asyncHandler(async (req, res) => {
        const activeOnly =
          typeof req.query.activeOnly === "string" && req.query.activeOnly === "true";
        const products = await catalogService.listProducts({ activeOnly });
        res.status(200).json({ items: products });
      }),
    );
  }

  if (cartRepo !== undefined) {
    shopRouter.post(
      "/carts",
      asyncHandler(async (req, res) => {
        const now = new Date().toISOString();
        const cartId = toCartId(randomUUID());
        const sessionId =
          typeof req.body?.sessionId === "string" && req.body.sessionId.trim() !== ""
            ? req.body.sessionId
            : req.requestId;
        const currency =
          typeof req.body?.currency === "string" && req.body.currency.trim() !== ""
            ? req.body.currency.trim().toUpperCase()
            : "USD";
        await cartRepo.save({
          id: cartId,
          sessionId: toSessionId(sessionId),
          customerId: undefined,
          currency,
          status: "active",
          createdAt: now,
          updatedAt: now,
          lines: [],
        });
        const created = await cartRepo.getById(cartId);
        res.status(201).json(created);
      }),
    );
  }

  if (cartService !== undefined) {
    shopRouter.post(
      "/carts/:cartId/lines",
      asyncHandler(async (req, res) => {
        const quantity = BigInt(String(req.body?.quantity ?? "1"));
        const line = await cartService.addLine(toCartId(String(req.params.cartId)), {
          productId: toProductId(String(req.body.productId)),
          variantId: toVariantId(String(req.body.variantId)),
          quantity,
        });
        res.status(201).json(line);
      }),
    );
  }

  if (orderService !== undefined && db !== undefined) {
    shopRouter.post(
      "/orders",
      createRequireIdempotencyKeyForPost(),
      asyncHandler(async (req, res) => {
        await withIdempotency(db, "post.orders", req, res, async () => {
          const order = await orderService.placeFromCart(toCartId(String(req.body.cartId)));
          res.status(201).json(order);
        });
      }),
    );
  }

  if (
    db !== undefined &&
    cartRepo !== undefined &&
    orderService !== undefined &&
    inventoryService !== undefined
  ) {
    shopRouter.post(
      "/checkout",
      createRequireIdempotencyKeyForPost(),
      asyncHandler(async (req, res) => {
        await withIdempotency(db, "post.checkout", req, res, async () => {
          const parsed = checkoutBodySchema.safeParse(req.body);
          if (!parsed.success) {
            const detail = parsed.error.issues.map((i) => i.message).join("; ");
            throw new DomainError("VALIDATION_ERROR", detail.length > 0 ? detail : "Invalid body");
          }
          const out = await runCheckoutWorkflow(
            { cartRepo, orderService, inventoryService },
            {
              cartId: toCartId(parsed.data.cartId),
              reservation: {
                lines: parsed.data.reservation.lines.map((l) => ({
                  variantId: toVariantId(l.variantId),
                  quantity: l.quantity,
                })),
                expiresAt: parsed.data.reservation.expiresAt,
              },
            },
          );
          if (!out.ok) {
            throw new DomainError("CHECKOUT_FAILED", `Checkout failed: ${out.reason}`);
          }
          res.status(200).json({ orderId: out.orderId, reservationId: out.reservationId });
        });
      }),
    );
  }

  if (taxService !== undefined) {
    shopRouter.get(
      "/tax/rates",
      asyncHandler(async (_req, res) => {
        const items = await taxService.listActiveRates();
        res.status(200).json({ items });
      }),
    );
    shopRouter.post(
      "/tax/estimate",
      asyncHandler(async (req, res) => {
        const countryCode = String(req.body?.countryCode ?? "").toUpperCase();
        if (countryCode.length !== 2) {
          throw new DomainError("VALIDATION_ERROR", "countryCode must be ISO 3166-1 alpha-2");
        }
        const currency = String(req.body?.currency ?? "USD").toUpperCase();
        const amountMinor = BigInt(String(req.body?.amountMinor ?? "0"));
        const out = await taxService.estimateForCountry({
          countryCode,
          taxable: { amountMinor, currency },
        });
        res.status(200).json({
          lines: out.lines.map((l) => ({
            rateName: l.rateName,
            rateBps: l.rateBps,
            tax: { amountMinor: l.tax.amountMinor.toString(), currency: l.tax.currency },
          })),
          totalTax: {
            amountMinor: out.totalTax.amountMinor.toString(),
            currency: out.totalTax.currency,
          },
        });
      }),
    );
  }

  if (paymentService !== undefined) {
    shopRouter.get(
      "/orders/:orderId/payments",
      asyncHandler(async (req, res) => {
        const items = await paymentService.findByOrderId(toOrderId(String(req.params.orderId)));
        res.status(200).json({ items });
      }),
    );
  }
  if (paymentService !== undefined && db !== undefined) {
    shopRouter.post(
      "/payments",
      createRequireIdempotencyKeyForPost(),
      asyncHandler(async (req, res) => {
        await withIdempotency(db, "post.payments", req, res, async () => {
          const now = new Date().toISOString();
          const rawPayId = req.body?.id;
          const id = toPaymentId(
            typeof rawPayId === "string" && rawPayId.length > 0 ? rawPayId : randomUUID(),
          );
          const orderId = toOrderId(String(req.body?.orderId));
          const status = String(req.body?.status ?? "pending") as PaymentStatus;
          const amount = {
            amountMinor: BigInt(String(req.body?.amount?.amountMinor ?? "0")),
            currency: String(req.body?.amount?.currency ?? "USD").toUpperCase(),
          };
          const payment: Payment = {
            id,
            orderId,
            status,
            amount,
            providerRef:
              typeof req.body?.providerRef === "string" && req.body.providerRef.length > 0
                ? req.body.providerRef
                : null,
            metadata:
              req.body?.metadata !== undefined &&
              req.body?.metadata !== null &&
              typeof req.body?.metadata === "object" &&
              !Array.isArray(req.body?.metadata)
                ? (req.body.metadata as Record<string, unknown>)
                : {},
            createdAt: typeof req.body?.createdAt === "string" ? req.body.createdAt : now,
            updatedAt: typeof req.body?.updatedAt === "string" ? req.body.updatedAt : now,
          };
          const saved = await paymentService.save(payment);
          res.status(201).json(saved);
        });
      }),
    );
  }

  if (
    orderRepo !== undefined &&
    paymentService !== undefined &&
    options.stripeSecretKey !== undefined &&
    options.stripeSecretKey.length > 0
  ) {
    addStripeShopPaymentIntentPost({
      shopRouter,
      orderRepo,
      paymentService,
      stripeSecretKey: options.stripeSecretKey,
      asyncHandler,
    });
  }

  if (inventoryService !== undefined) {
    shopRouter.get(
      "/inventory/variants/:variantId/atp",
      asyncHandler(async (req, res) => {
        const atp = await inventoryService.getAvailableToPromise(
          toVariantId(String(req.params.variantId)),
        );
        res.status(200).json({ availableToPromise: atp.toString() });
      }),
    );
    shopRouter.post(
      "/inventory/reserve",
      asyncHandler(async (req, res) => {
        const expiresAt = String(req.body?.expiresAt ?? "");
        if (expiresAt.trim() === "") {
          throw new DomainError("VALIDATION_ERROR", "expiresAt is required");
        }
        const linesRaw = req.body?.lines;
        if (!Array.isArray(linesRaw)) {
          throw new DomainError("VALIDATION_ERROR", "lines must be an array");
        }
        const orderIdRaw = req.body?.orderId;
        const orderId =
          orderIdRaw === null || orderIdRaw === undefined || String(orderIdRaw) === ""
            ? null
            : toOrderId(String(orderIdRaw));
        const lines = linesRaw.map((line: { variantId?: unknown; quantity?: unknown }) => ({
          variantId: toVariantId(String(line?.variantId)),
          quantity: BigInt(String(line?.quantity ?? "0")),
        }));
        const reservation = await inventoryService.reserve({
          orderId,
          lines,
          expiresAt,
        });
        res.status(201).json(reservation);
      }),
    );
  }
}
