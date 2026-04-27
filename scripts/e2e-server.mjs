/**
 * One-shot: schema push + seed + block on core-api. Used as Playwright `webServer` command.
 * Uses isolated SQLite under tests/e2e/ and MIGRATIONS_ON_START=0 (schema from push, not journal migrate).
 */
import { execSync, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbFile = path.join(root, "tests", "e2e", "e2e.sqlite");
mkdirSync(path.dirname(dbFile), { recursive: true });

const e2eEnv = {
  ...process.env,
  DRIZZLE_DB_URL: dbFile,
  DATABASE_PATH: dbFile,
  /** Avoid running SQL migrations on top of a push-only E2E DB. */
  MIGRATIONS_ON_START: "0",
  PORT: "3310",
  NODE_ENV: "development",
};

execSync("npx drizzle-kit push --force", {
  cwd: path.join(root, "packages", "persistence-drizzle"),
  env: e2eEnv,
  stdio: "inherit",
  shell: true,
});
execSync("npx tsx scripts/seed-mvp.ts", { cwd: root, env: e2eEnv, stdio: "inherit", shell: true });

const child = spawn("npx", ["tsx", "src/main.ts"], {
  cwd: path.join(root, "apps", "core-api"),
  env: e2eEnv,
  stdio: "inherit",
  shell: true,
});
const onSig = () => {
  child.kill("SIGTERM");
};
process.on("SIGINT", onSig);
process.on("SIGTERM", onSig);
child.on("exit", (code) => {
  process.exit(code ?? 0);
});
