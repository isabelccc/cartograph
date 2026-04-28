/**
 * **Shared types for `createApp`** — options, lifecycle (`CreatedApp`), and `AppContext`.
 *
 * - **`AppContext`:** process-wide deps passed once (`logger`, `db`, `resolveTenant`, observability).
 *   Handlers read `req.app.locals.ctx` (typed via `AppLocals`).
 * - **`CreateAppOptions`:** everything needed to build HTTP + wire Stripe/plugins (extends env-derived flags).
 * - **Deep dive:** tenant resolution lives in **caller** (`main.ts` passes `resolveTenant`); this file only types it.
 */
import type { Request } from "express";
import type { AppDb } from "../../../../packages/persistence-drizzle/src/client.js";
import type { Metrics } from "../../../../packages/observability/src/metrics.js";
import type { Tracing } from "../../../../packages/observability/src/tracing.js";
import type { AuditLog } from "../../../../packages/observability/src/audit-log.js";
import type { OidcVerifier } from "../../../../packages/authz/src/oidc.js";
import type { RequestLogger } from "../config/logger.js";
import type { PluginsManifest } from "../plugins.types.js";

declare global {
  namespace Express {
    interface Application {
      locals: AppLocals;
    }
  }
}

interface AppLocals {
  readonly ctx: AppContext;
}

export type { PluginsManifest } from "../plugins.types.js";

export interface AppContext {
  logger: RequestLogger;
  db: AppDb | undefined;
  featureFlags: Record<string, boolean>;
  /** Typically uses `X-Tenant-Id` + `DEFAULT_TENANT_ID` — implemented where `AppContext` is constructed. */
  resolveTenant(req: Request): string | null;
  metrics?: Metrics;
  tracing?: Tracing;
  auditLog?: AuditLog;
  dispose?: () => Promise<void>;
}

export interface CreateAppOptions {
  manifest: PluginsManifest;
  context: AppContext;
  adminPath?: string;
  shopPath?: string;
  migrationsFolder?: string;
  applyMigrationsOnStart?: boolean;
  adminApiKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  shopApiKey?: string;
  corsOrigin?: string;
  promotionDiscountBps?: bigint;
  rateLimitPerMinute?: number;
  oidcVerifier?: OidcVerifier;
  redisUrl?: string;
  meiliUrl?: string;
  meiliKey?: string;
  shippingApiKey?: string;
}

export interface CreatedAppMeta {
  readonly name: string;
  readonly version: string;
  readonly mountPaths: {
    readonly admin: string;
    readonly shop: string;
  };
  readonly pluginNames: readonly string[];
}

export interface CreatedApp {
  readonly express: import("express").Application;
  ready(): Promise<void>;
  readonly meta: CreatedAppMeta;
  close(): Promise<void>;
}
