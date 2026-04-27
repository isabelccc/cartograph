/**
 * Stripe PaymentIntents: shop route + signed webhook to persist status.
 */
import { randomUUID } from "node:crypto";
import type { Request, Response, Router } from "express";
import Stripe from "stripe";
import { DomainError } from "../../../../packages/domain-contracts/src/errors.js";
import { toOrderId, toPaymentId } from "../../../../packages/domain-contracts/src/ids.js";
import type { PaymentService } from "../../../../packages/modules/payment/payment.service.js";
import type { PaymentStatus } from "../../../../packages/modules/payment/payment.types.js";
import type { OrderRepositoryPort } from "../../../../packages/modules/order/order.repository.port.js";
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
}): (req: Request, res: Response) => Promise<void> {
  const { webhookSecret, paymentService, logger } = opts;

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
    }

    res.json({ received: true });
  };
}
