/**
 * HTTP process entrypoint (core-api).
 *
 * Requirements:
 * - R-NF-2: Bind logger at startup; subsequent requests carry requestId / tenantId (nullable).
 * - R-NF-3: Uncaught errors must not return stack traces to clients.
 * - R-NF-4: Risky capabilities behind feature flags (aligned with config/feature-flags).
 * - Bootstrap order matches kernel: config → DB → migrations → plugins → HTTP.
 *
 * TODO:
 * - [ ] Readiness beyond `ready()` (DB/redis) and dedicated `/ready` route.
 * - [ ] Register global Idempotency-Key handling for mutating handlers (R-NF-1).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Apps core-api, Global R-NF-*
 */
import { fileURLToPath } from "node:url";

import type { AppContext } from "./app.js";
import { createApp } from "./app.js";
import { createFeatureFlags } from "./config/feature-flags.js";
import { parseEnv } from "./config/env.schema.js";
import { createHttpServer } from "./http/server.js";
import { loadPlugins } from "./plugins.manifest.js";
import { openDrizzleSqlite } from "../../../packages/persistence-drizzle/src/client.js";

function buildLogger() {
  return {
    info(message: string, meta?: Record<string, unknown>) {
      console.log(`[INFO] ${message}`, meta ?? "");
    },
    warn(message: string, meta?: Record<string, unknown>) {
      console.warn(`[WARN] ${message}`, meta ?? "");
    },
    error(message: string, meta?: Record<string, unknown>) {
      console.error(`[ERROR] ${message}`, meta ?? "");
    },
  };
}

export async function main(): Promise<void> {
  const env = parseEnv();
  const logger = buildLogger();
  const sqlite = openDrizzleSqlite(env.databasePath);

  const context: AppContext = {
    logger,
    db: sqlite.db,
    featureFlags: createFeatureFlags(env.featureFlags),
    resolveTenant() {
      return null;
    },
    dispose: async () => {
      sqlite.close();
    },
  };

  const manifest = loadPlugins();
  const created = createApp({ manifest, context });
  const http = createHttpServer(created, { port: env.port });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    context.logger.info("shutdown", { signal });
    try {
      await http.close();
    } catch (err) {
      context.logger.error("shutdown error", { err: String(err) });
      process.exitCode = 1;
    }
    process.exit(process.exitCode ?? 0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  await http.listen();

  const { mountPaths } = created.meta;
  context.logger.info("listening", {
    port: env.port,
    nodeEnv: env.nodeEnv,
    databasePath: env.databasePath,
    health: {
      admin: `http://127.0.0.1:${env.port}${mountPaths.admin}/health`,
      shop: `http://127.0.0.1:${env.port}${mountPaths.shop}/health`,
    },
  });
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
