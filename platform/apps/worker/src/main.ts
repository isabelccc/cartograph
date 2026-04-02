/**
 * Worker process entry (BullMQ / pg-boss, etc.).
 *
 * Requirements:
 * - R-NF-7: Retries with backoff, dead-letter queue, alerting hooks.
 * - Share env / logger conventions with core-api; no HTTP or only a metrics port.
 *
 * TODO:
 * - [ ] Connect to the queue backend; register consumers from the processors directory.
 * - [ ] Graceful shutdown: stop dequeuing, wait for in-flight jobs or timeout.
 * - [ ] Expose queue depth and failure-rate metrics (see observability/metrics).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Apps worker, R-NF-7
 */
export function main(): never {
  throw new Error("TODO: worker main — see file header JSDoc");
}
