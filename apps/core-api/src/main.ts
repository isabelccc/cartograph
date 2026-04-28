/**
 * HTTP process entrypoint (core-api).
 *
 * ## What this file is **not**
 * - No route definitions — those live in **`app.ts`** + **`app/routes/`**.
 *
 * ## Bootstrap order (typical interview question)
 * 1. **`parseEnv`** — Zod-validated config (`config/env.schema.ts`).
 * 2. **SQLite + Drizzle** — `openDrizzleSqlite`; optional OIDC verifier, metrics, tracing, audit.
 * 3. **`loadPlugins`** — manifest for `CommercePlugin`s.
 * 4. **`createApp`** — Express app + mount routers (`app.ts`).
 * 5. **`createHttpServer`** — bind port, graceful shutdown.
 *
 * ## Reading order for onboarding / deep dive
 * `main.ts` → `app.ts` → `composition/domain-wiring.ts` → `composition/routes/register-shop.routes.ts` → `packages/modules/order/order.service.ts`
 *
 * Requirements:
 * - R-NF-2: Bind logger at startup; subsequent requests carry requestId / tenantId (nullable).
 * - R-NF-3: Uncaught errors must not return stack traces to clients.
 * - R-NF-4: Risky capabilities behind feature flags (aligned with config/feature-flags).
 *
 * **Idempotency (R-NF-1):** selected shop POSTs use shared middleware (`http/idempotency-post.ts`).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Apps core-api, Global R-NF-*
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Request } from "express";

import type { AppContext } from "./app.js";
import { createApp } from "./app.js";
import { createRootLogger } from "./config/logger.js";
import { createFeatureFlags } from "./config/feature-flags.js";
import { parseEnv } from "./config/env.schema.js";
import { createHttpServer } from "./http/server.js";
import { loadPlugins } from "./plugins.manifest.js";
import { openDrizzleSqlite } from "../../../packages/persistence-drizzle/src/client.js";
import { createMetrics } from "../../../packages/observability/src/metrics.js";
import { createTracing } from "../../../packages/observability/src/tracing.js";
import { createAuditLog } from "../../../packages/observability/src/audit-log.js";
import { createOidcVerifier } from "../../../packages/authz/src/oidc.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationsFolder = path.join(repoRoot, "packages/persistence-drizzle/src/migrations");

export async function main(): Promise<void> {
  const env = parseEnv();
  const logger = createRootLogger({ service: "core-api" });
  const sqlite = openDrizzleSqlite(env.databasePath);
  const metrics = createMetrics();
  const tracing = createTracing();
  const auditLog = createAuditLog();
  const oidcVerifier =
    env.oidcIssuer !== undefined && env.oidcAudience !== undefined && env.oidcJwksUrl !== undefined
      ? createOidcVerifier({
          issuer: env.oidcIssuer,
          audience: env.oidcAudience,
          jwksUrl: env.oidcJwksUrl,
        })
      : undefined;

  const context: AppContext = {
    logger,
    db: sqlite.db,
    featureFlags: createFeatureFlags(env.featureFlags),
    metrics,
    tracing,
    auditLog,
    resolveTenant(req: Request) {
      const raw = req.header("x-tenant-id");
      if (raw !== undefined && raw.trim() !== "") {
        return raw.trim();
      }
      return env.defaultTenantId ?? null;
    },
    dispose: async () => {
      sqlite.close();
    },
  };

  const manifest = loadPlugins({ env, logger });
  const created = createApp({
    manifest,
    context,
    applyMigrationsOnStart: env.applyMigrationsOnStart,
    migrationsFolder,
    adminApiKey: env.adminApiKey,
    stripeSecretKey: env.stripeSecretKey,
    stripeWebhookSecret: env.stripeWebhookSecret,
    shopApiKey: env.shopApiKey,
    corsOrigin: env.corsOrigin,
    promotionDiscountBps: env.promotionDiscountBps,
    rateLimitPerMinute: env.rateLimitPerMinute,
    oidcVerifier,
    redisUrl: env.redisUrl,
    meiliUrl: env.meiliUrl,
    meiliKey: env.meiliKey,
    shippingApiKey: env.shippingApiKey,
  });
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
    applyMigrationsOnStart: env.applyMigrationsOnStart,
    health: {
      admin: `http://127.0.0.1:${env.port}${mountPaths.admin}/health`,
      shop: `http://127.0.0.1:${env.port}${mountPaths.shop}/health`,
    },
    ready: {
      root: `http://127.0.0.1:${env.port}/ready`,
      admin: `http://127.0.0.1:${env.port}${mountPaths.admin}/ready`,
      shop: `http://127.0.0.1:${env.port}${mountPaths.shop}/ready`,
    },
    demo: {
      plugin: `http://127.0.0.1:${env.port}${mountPaths.shop}/plugin/core-defaults`,
      idempotentPost: `http://127.0.0.1:${env.port}${mountPaths.shop}/demo/commits`,
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
