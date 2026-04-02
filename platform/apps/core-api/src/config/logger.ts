/**
 * Structured logging (pino / winston) + trace / request id.
 *
 * Requirements:
 * - R-NF-2: Every log line includes `requestId`; when known, include `tenantId`, `workflowId`, `orderId`.
 * - Do not log full PII in production by default; document redaction rules for required fields.
 *
 * TODO:
 * - [ ] Child logger factory: `createLogger(bindings)`.
 * - [ ] HTTP middleware: accept or generate `x-request-id` (UUID), store in async local storage.
 * - [ ] Correlate with observability/tracing traceId when OTEL is enabled.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — R-NF-2
 */
export function createLogger(): never {
  throw new Error("TODO: logger — see file header JSDoc");
}
