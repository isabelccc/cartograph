/**
 * **Stripe integration** — two entry points only:
 *
 * 1. **`addStripeShopPaymentIntentPost`** — `POST /store/v1/payments/stripe/intent`
 *    Creates Stripe PI + persists a **`pending`** `Payment` row (`providerRef` = PI id).
 * 2. **`createStripeWebhookHandler`** — mounted in **`app.ts`** on **`POST /webhooks/stripe`** with **`express.raw`**
 *    (must run **before** global `express.json`).
 *
 * Webhook updates `Payment` (`captured` / `failed` / `canceled`). On `payment_intent.succeeded`,
 * optionally **`orderService.markPaid`** after amount/currency/order checks (idempotent if order already `paid`).
 */
import { randomUUID } from "node:crypto";
import type { Request, Response, Router } from "express";
import Stripe from "stripe";
import { DomainError } from "../../../../packages/domain-contracts/src/errors.js";
import { toOrderId, toPaymentId } from "../../../../packages/domain-contracts/src/ids.js";
import type { PaymentService } from "../../../../packages/modules/payment/payment.service.js";
import type { PaymentStatus } from "../../../../packages/modules/payment/payment.types.js";
import type { OrderRepositoryPort } from "../../../../packages/modules/order/order.repository.port.js";
import type { OrderService } from "../../../../packages/modules/order/order.service.js";
import type { AsyncRequestHandler } from "../../../../packages/api-rest/src/async-handler.js";
import type { RequestLogger } from "../config/logger.js";

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-08-27.basil";

export function addStripeShopPaymentIntentPost(opts: {
  shopRouter: Router;
  orderRepo: OrderRepositoryPort;
  paymentService: PaymentService;
  stripeSecretKey: string;
  asyncHandler: (fn: AsyncRequestHandler) => import("express").RequestHandler;
}): void {
  const { shopRouter, orderRepo, paymentService, stripeSecretKey, asyncHandler } = opts;
  const stripe = new Stripe(stripeSecretKey, { apiVersion: STRIPE_API_VERSION });

  shopRouter.post(
    "/payments/stripe/intent",
    asyncHandler(async (req, res) => {
      const orderId = toOrderId(String(req.body?.orderId ?? ""));
      const order = await orderRepo.getById(orderId);
      if (order === null) {
        throw new DomainError("ORDER_NOT_FOUND", "order not found");
      }
      if (order.total.amountMinor < 0n) {
        throw new DomainError("PAYMENT_AMOUNT_INVALID", "order total is invalid for payment");
      }
      if (order.total.amountMinor > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new DomainError("PAYMENT_AMOUNT_INVALID", "order total is too large for PaymentIntent amount");
      }

      const paymentId = toPaymentId(randomUUID());
      const amountMinor = Number(order.total.amountMinor);
      const pi = await stripe.paymentIntents.create({
        amount: amountMinor,
        currency: order.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          orderId: String(order.id),
          paymentId: String(paymentId),
        },
      });

      const now = new Date().toISOString();
      await paymentService.save({
        id: paymentId,
        orderId: order.id,
        status: "pending",
        amount: { amountMinor: order.total.amountMinor, currency: order.currency },
        providerRef: pi.id,
        metadata: {
          stripePaymentIntentId: pi.id,
        },
        createdAt: now,
        updatedAt: now,
      });

      res.status(201).json({
        paymentId,
        clientSecret: pi.client_secret,
        stripePaymentIntentId: pi.id,
        orderId: order.id,
        amount: { amountMinor: order.total.amountMinor.toString(), currency: order.currency },
      });
    }),
  );
}

export function createStripeWebhookHandler(opts: {
  webhookSecret: string;
  paymentService: PaymentService;
  logger: RequestLogger;
  /** When set, `payment_intent.succeeded` updates order to `paid` after amount/currency checks (idempotent for duplicate webhooks). */
  readonly orderRepo?: OrderRepositoryPort;
  readonly orderService?: OrderService;
}): (req: Request, res: Response) => Promise<void> {
  const { webhookSecret, paymentService, logger, orderRepo, orderService } = opts;

  return async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
    const sig = req.headers["stripe-signature"];
    if (typeof sig !== "string") {
      res.status(400).type("text/plain").send("Missing stripe-signature");
      return;
    }
    if (!Buffer.isBuffer(req.body)) {
      res.status(400).type("text/plain").send("Expected raw body for Stripe webhook");
      return;
    }
    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      logger.error("stripe_webhook_signature", { err: String(err) });
      res.status(400).type("text/plain").send(`Webhook signature verification failed.`);
      return;
    }

    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled"
    ) {
      const pi = event.data.object as Stripe.PaymentIntent;
      const existing = await paymentService.getByProviderRef(pi.id);
      if (existing === null) {
        logger.info("stripe_webhook_unknown_intent", { paymentIntentId: pi.id, type: event.type });
        res.json({ received: true, ignored: true });
        return;
      }

      let status: PaymentStatus = existing.status;
      if (event.type === "payment_intent.succeeded") {
        status = "captured";
      } else if (event.type === "payment_intent.payment_failed") {
        status = "failed";
      } else {
        status = "canceled";
      }

      const now = new Date().toISOString();
      await paymentService.save({
        ...existing,
        status,
        providerRef: existing.providerRef ?? pi.id,
        metadata: {
          ...existing.metadata,
          lastStripeEventId: event.id,
          lastStripeEventType: event.type,
        },
        updatedAt: now,
      });

      if (
        event.type === "payment_intent.succeeded" &&
        status === "captured" &&
        orderRepo !== undefined &&
        orderService !== undefined
      ) {
        const order = await orderRepo.getById(existing.orderId);
        if (order === null) {
          logger.error("stripe_webhook_order_not_found_after_capture", {
            orderId: String(existing.orderId),
            paymentIntentId: pi.id,
          });
        } else if (order.status === "cancelled") {
          logger.warn("stripe_webhook_succeeded_but_order_cancelled", { orderId: String(order.id) });
        } else {
          const piMinor = BigInt(pi.amount);
          if (piMinor !== order.total.amountMinor) {
            logger.error("stripe_webhook_amount_mismatch", {
              orderId: String(order.id),
              paymentIntentMinor: String(piMinor),
              orderTotalMinor: String(order.total.amountMinor),
            });
          } else if (pi.currency.toUpperCase() !== order.currency.toUpperCase()) {
            logger.error("stripe_webhook_currency_mismatch", {
              orderId: String(order.id),
              piCurrency: pi.currency,
              orderCurrency: order.currency,
            });
          } else if (
            existing.amount.amountMinor !== order.total.amountMinor ||
            existing.amount.currency !== order.currency
          ) {
            logger.error("stripe_webhook_payment_row_mismatch_order_total", {
              orderId: String(order.id),
              paymentId: String(existing.id),
            });
          } else {
            try {
              await orderService.markPaid(order.id);
            } catch (e) {
              if (e instanceof DomainError && e.code === "ORDER_STATE_INVALID") {
                logger.warn("stripe_webhook_mark_paid_skipped_invalid_transition", {
                  orderId: String(order.id),
                  orderStatus: order.status,
                  detail: e.message,
                });
              } else {
                throw e;
              }
            }
          }
        }
      }
    }

    res.json({ received: true });
  };
}
