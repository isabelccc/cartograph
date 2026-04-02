/**
 * Transactional outbox write.
 *
 * Requirements:
 * - Same DB transaction as aggregate commit
 *
 * TODO:
 * - [ ] Insert outbox row in TX
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Events & outbox
 */
export function publishToOutbox(): never {
  throw new Error("TODO: publishToOutbox — see file header JSDoc");
}

