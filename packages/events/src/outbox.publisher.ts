/**
 * Transactional outbox write. Prefer calling inside the same DB transaction as aggregate `save`.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Events & outbox
 */
import type { AppDb } from "../../persistence-drizzle/src/client.js";
import { enqueueOutbox } from "../../persistence-drizzle/src/outbox/drain.js";

export function publishToOutbox(
  db: AppDb,
  row: { readonly type: string; readonly payload: string },
): void {
  enqueueOutbox(db, row.type, row.payload);
}
