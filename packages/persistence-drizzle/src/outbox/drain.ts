/**
 * Drain unpublished outbox rows (worker / cron). Marks rows published after "relay".
 */
import { randomUUID } from "node:crypto";
import type { AppDb } from "../client.js";

export function ensureOutboxTable(db: AppDb): void {
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS outbox (
      id text primary key,
      topic text not null,
      payload text not null,
      created_at text not null,
      published_at text
    );
  `);
}

/**
 * @returns number of rows marked published this tick.
 */
export function drainOutbox(db: AppDb, limit: number): number {
  ensureOutboxTable(db);
  const rows = nextOutboxBatch(db, limit).map((r) => ({ id: r.id }));
  markOutboxPublished(db, rows.map((r) => r.id));
  return rows.length;
}

export type OutboxRow = {
  readonly id: string;
  readonly topic: string;
  readonly payload: string;
  readonly createdAt: string;
};

export function nextOutboxBatch(db: AppDb, limit: number): readonly OutboxRow[] {
  ensureOutboxTable(db);
  const sel = db.$client.prepare(
    `SELECT id, topic, payload, created_at FROM outbox WHERE published_at IS NULL ORDER BY created_at ASC LIMIT ?`,
  );
  return sel.all(limit) as OutboxRow[];
}

export function markOutboxPublished(db: AppDb, ids: readonly string[]): void {
  ensureOutboxTable(db);
  if (ids.length === 0) {
    return;
  }
  const now = new Date().toISOString();
  const upd = db.$client.prepare(`UPDATE outbox SET published_at = ? WHERE id = ?`);
  for (const id of ids) {
    upd.run(now, id);
  }
}

/**
 * Enqueue a domain event (optional use from services via app layer).
 */
export function enqueueOutbox(db: AppDb, topic: string, payload: string): void {
  ensureOutboxTable(db);
  const id = randomUUID();
  const now = new Date().toISOString();
  db.$client
    .prepare(
      `INSERT INTO outbox (id, topic, payload, created_at, published_at) VALUES (?, ?, ?, ?, NULL)`,
    )
    .run(id, topic, payload, now);
}
