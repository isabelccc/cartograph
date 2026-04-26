/**
 * Drizzle client: SQLite file + typed `AppDb`.
 *
 * **Typing pattern:** `AppDb = BetterSQLite3Database<typeof schema>` — that is the “real Drizzle DB
 * type” you pass into `createCartRepository(db)`.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Persistence
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema/index.js";

type SqliteConnection = InstanceType<typeof Database>;

/** Use this type in repositories: `createCartRepository(db: AppDb)`. */
export type AppDb = BetterSQLite3Database<typeof schema> & { $client: SqliteConnection };

export interface DrizzleSqliteHandle {
  readonly db: AppDb;
  /** Close the underlying SQLite connection (idempotent for tests / shutdown). */
  close(): void;
}

/**
 * Open SQLite + Drizzle with an explicit lifecycle. Prefer this in long-lived servers;
 * call {@link close} on shutdown.
 *
 * @param databasePath e.g. `:memory:` or `./data.sqlite`
 */
export function openDrizzleSqlite(databasePath: string): DrizzleSqliteHandle {
  const sqlite = new Database(databasePath);
  const db = drizzle(sqlite, { schema });
  return {
    db,
    close: () => {
      try {
        sqlite.close();
      } catch {
        // already closed
      }
    },
  };
}

/**
 * @param databasePath e.g. `:memory:` or `./data.sqlite`
 */
export function createDrizzleClient(databasePath: string): AppDb {
  return openDrizzleSqlite(databasePath).db;
}
