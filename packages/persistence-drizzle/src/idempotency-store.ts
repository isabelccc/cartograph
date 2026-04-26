/**
 * SQLite-backed idempotency key storage (R-NF-1).
 *
 * Table is created with `ensureIdempotencyTable` so deploys without a matching
 * Drizzle journal entry still work.
 */
import type { AppDb } from "./client.js";

export type IdempotencyRecord = {
  readonly statusCode: number;
  readonly contentType: string;
  readonly body: string;
  readonly fingerprint: string;
};

export function ensureIdempotencyTable(db: AppDb): void {
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      scope text not null,
      key text not null,
      status_code integer not null,
      content_type text not null,
      body text not null,
      fingerprint text not null,
      created_at text not null,
      primary key (scope, key)
    )
  `);
}

type IdempotencyRow = {
  status_code: number;
  content_type: string;
  body: string;
  fingerprint: string;
};

export function createIdempotencyStore(db: AppDb) {
  const sel = db.$client.prepare(
    `SELECT status_code, content_type, body, fingerprint FROM idempotency_keys WHERE scope = ? AND key = ?`,
  );

  const ins = db.$client.prepare(
    `INSERT INTO idempotency_keys (scope, key, status_code, content_type, body, fingerprint, created_at)
     VALUES (@scope, @key, @status_code, @content_type, @body, @fingerprint, @created_at)`,
  );

  return {
    get(scope: string, key: string): IdempotencyRecord | undefined {
      const row = sel.get(scope, key) as IdempotencyRow | undefined;
      if (row === undefined) return undefined;
      return {
        statusCode: row.status_code,
        contentType: row.content_type,
        body: row.body,
        fingerprint: row.fingerprint,
      };
    },

    save(
      scope: string,
      key: string,
      fingerprint: string,
      statusCode: number,
      contentType: string,
      body: string,
    ): void {
      ins.run({
        scope,
        key,
        status_code: statusCode,
        content_type: contentType,
        body,
        fingerprint,
        created_at: new Date().toISOString(),
      });
    },
  };
}
