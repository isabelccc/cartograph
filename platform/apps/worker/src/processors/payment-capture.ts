/**
 * Asynchronous payment capture and reconciliation.
 *
 * Requirements:
 * - Align with the `payment` module state machine; avoid conflicting dual writes with HTTP handlers (single write path).
 * - Calls to the payment provider must use idempotency keys (R-NF-1).
 *
 * TODO:
 * - [ ] Consume “pending capture” jobs; call `payment.provider.port`.
 * - [ ] On success/failure update payment aggregate and append outbox (e.g. OrderPaid).
 * - [ ] Reconciliation job: pull provider reports, diff against local payments, log discrepancies to audit trail.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — payment module, Workflows
 */
export function registerPaymentCaptureProcessor(): never {
  throw new Error("TODO: payment-capture processor — see file header JSDoc");
}
