/**
 * Stripe adapter implementing PaymentProviderPort.
 *
 * Requirements:
 * - No direct order mutations; R-NF-5 secrets from env
 *
 * TODO:
 * - [ ] Map Stripe intents to domain payment states
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Plugins — payment-stripe
 */
export function createStripePaymentProvider(): never {
  throw new Error("TODO: createStripePaymentProvider — see file header JSDoc");
}

