/**
 * Run Drizzle SQL migrations against DATABASE_PATH (production-style step).
 * Usage: DATABASE_PATH=/data/app.sqlite node scripts/prod-migrate.mjs
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = process.env.DATABASE_PATH?.trim();
if (db === undefined || db.length === 0) {
  console.error("DATABASE_PATH is required");
  process.exit(1);
}

execSync("npx drizzle-kit migrate", {
  cwd: path.join(root, "packages", "persistence-drizzle"),
  env: { ...process.env, DRIZZLE_DB_URL: db },
  stdio: "inherit",
});
