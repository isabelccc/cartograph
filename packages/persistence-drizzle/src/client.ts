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

/** Use this type in repositories: `createCartRepository(db: AppDb)`. */
export type AppDb = BetterSQLite3Database<typeof schema>;

/**
 * @param databasePath e.g. `:memory:` or `./data.sqlite`
 */
export function createDrizzleClient(databasePath: string): AppDb {
  const sqlite = new Database(databasePath);
  return drizzle(sqlite, { schema });
}
