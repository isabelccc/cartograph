/**
 * Outbox drain tick (SQLite). Swap `relayOutboxBatch` for a real broker when you add a queue.
 */
import type { AppDb } from "../../../../packages/persistence-drizzle/src/client.js";
import { relayOutboxBatch } from "../../../../packages/events/src/outbox.relay.js";

export async function runOutboxDispatchTick(
  db: AppDb,
  limit: number,
  opts?: { readonly redisUrl?: string },
): Promise<number> {
  return relayOutboxBatch(db, limit, opts);
}
