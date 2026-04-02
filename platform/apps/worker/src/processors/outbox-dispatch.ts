/**
 * Relay domain events from the outbox table to webhooks, search index, etc.
 *
 * Requirements:
 * - Coordinate with `events/outbox.relay`; consumers must be idempotent (`processed_events` or unique constraint).
 * - Failed deliveries must be retryable; exceed threshold → DLQ + alert.
 *
 * TODO:
 * - [ ] Poll or LISTEN/NOTIFY for unpublished outbox rows; send in batches.
 * - [ ] On success update `published_at` / status; on failure increment retry count.
 * - [ ] Support multiple subscribers (search, analytics, third-party webhooks).
 *
 * @see ../../../../../docs/SERIES-B-PLATFORM.md — Events & outbox
 */
export function registerOutboxDispatchProcessor(): never {
  throw new Error("TODO: outbox-dispatch processor — see file header JSDoc");
}
