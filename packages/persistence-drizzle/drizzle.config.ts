/**
 * Drizzle Kit CLI config (generate / push / migrate).
 *
 * Run from this directory (`packages/persistence-drizzle`) so paths resolve.
 *
 * @see https://orm.drizzle.team/docs/drizzle-config-file
 */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data.sqlite",
  },
});
