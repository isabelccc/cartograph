/**
 * Mark unpublished outbox rows as published (SQLite drain). Replace with real broker relay when wired.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Events & outbox
 */
import type { AppDb } from "../../persistence-drizzle/src/client.js";
import { createOutboxQueue } from "./queue.js";
import { markOutboxPublished, nextOutboxBatch } from "../../persistence-drizzle/src/outbox/drain.js";

export async function relayOutboxBatch(
  db: AppDb,
  max: number = 10,
  opts?: { readonly redisUrl?: string },
): Promise<number> {
  const rows = nextOutboxBatch(db, max);
  if (rows.length === 0) {
    return 0;
  }
  if (opts?.redisUrl === undefined) {
    markOutboxPublished(
      db,
      rows.map((r) => r.id),
    );
    return rows.length;
  }
  const q = createOutboxQueue(opts.redisUrl);
  for (const row of rows) {
    await q.add(row.topic, { id: row.id, topic: row.topic, payload: row.payload });
  }
  await q.close();
  markOutboxPublished(
    db,
    rows.map((r) => r.id),
  );
  return rows.length;
}
