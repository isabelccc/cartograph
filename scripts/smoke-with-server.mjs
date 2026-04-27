/**
 * One-shot: isolated SQLite, schema push, seed, start core-api, run smoke, exit.
 *
 *   npm run smoke:local
 *
 * Env:
 *   SMOKE_LOCAL_PORT — API port (default 3320)
 *   SMOKE_LOCAL_SKIP_DEEP — if "1", shallow smoke only
 */
import { execSync, spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbFile = path.join(root, "tests", "smoke", "smoke.sqlite");
mkdirSync(path.dirname(dbFile), { recursive: true });

const port = process.env.SMOKE_LOCAL_PORT ?? "3320";
const skipDeep = process.env.SMOKE_LOCAL_SKIP_DEEP === "1";

const apiEnv = {
  ...process.env,
  DRIZZLE_DB_URL: dbFile,
  DATABASE_PATH: dbFile,
  MIGRATIONS_ON_START: "0",
  PORT: port,
  NODE_ENV: "development",
};

execSync("npx drizzle-kit push --force", {
  cwd: path.join(root, "packages", "persistence-drizzle"),
  env: apiEnv,
  stdio: "inherit",
  shell: true,
});
execSync("npx tsx scripts/seed-mvp.ts", { cwd: root, env: apiEnv, stdio: "inherit", shell: true });

const child = spawn("npx", ["tsx", "src/main.ts"], {
  cwd: path.join(root, "apps", "core-api"),
  env: apiEnv,
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

const baseUrl = `http://127.0.0.1:${port}`;

function killApi() {
  try {
    child.kill("SIGTERM");
  } catch {
    /* ignore */
  }
}

process.on("SIGINT", () => {
  killApi();
  process.exit(130);
});
process.on("SIGTERM", () => {
  killApi();
  process.exit(143);
});

async function waitReady(maxMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await fetch(`${baseUrl}/ready`);
      if (r.ok) {
        const j = await r.json();
        if (j.ok === true) return;
      }
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Timeout waiting for GET ${baseUrl}/ready`);
}

try {
  await waitReady();
  const smokeEnv = {
    ...process.env,
    SMOKE_BASE_URL: baseUrl,
    SMOKE_STRICT_SEED: "1",
    ...(skipDeep ? {} : { SMOKE_DEEP: "1" }),
  };
  execSync("npx tsx scripts/smoke-mvp.ts", {
    cwd: root,
    env: smokeEnv,
    stdio: "inherit",
    shell: true,
  });
} finally {
  killApi();
}
