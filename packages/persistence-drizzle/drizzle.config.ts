/**
 * Drizzle Kit CLI config (generate / push / migrate).
 *
 * Run from this directory (`packages/persistence-drizzle`) so paths resolve.
 *
 * @see https://orm.drizzle.team/docs/drizzle-config-file
 */
import { defineConfig } from "drizzle-kit";

/** Override default `./data.sqlite` (e.g. E2E uses `DRIZZLE_DB_URL` with an absolute path). */
const fromEnv = process.env.DRIZZLE_DB_URL?.trim();
const url = fromEnv === undefined || fromEnv.length === 0 ? "./data.sqlite" : fromEnv;

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url,
  },
});
