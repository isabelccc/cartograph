/**
 * Apply Drizzle SQL migrations from disk (policy: opt-in via env in production).
 *
 * **Policy:** Default `MIGRATIONS_ON_START=true` in `development`, `false` in
 * `staging` / `production`. Set `MIGRATIONS_ON_START=1` in deploy scripts when
 * you want the process to migrate on boot; otherwise run `pnpm db:push` /
 * `drizzle-kit migrate` as a separate job (recommended for production).
 */
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { AppDb } from "../../../../packages/persistence-drizzle/src/client.js";

export function applyPendingMigrations(db: AppDb, migrationsFolder: string): void {
  migrate(db, { migrationsFolder });
}
