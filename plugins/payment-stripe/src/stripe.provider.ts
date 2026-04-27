/**
 * Stripe adapter (port shape only; real flows live in core-api with STRIPE_SECRET_KEY).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Plugins — payment-stripe
 */
import type { PaymentProviderPort } from "../../../packages/modules/payment/payment.provider.port.js";

export function createStripePaymentProvider(): PaymentProviderPort {
  return {};
}
