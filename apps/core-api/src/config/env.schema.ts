/**
 * Environment variable validation (Zod).
 *
 * Requirements:
 * - R-NF-5: Secrets only from env; no real secrets in defaults.
 * - Refuse to start in production if required vars are missing.
 *
 * **Migrations:** `MIGRATIONS_ON_START` — when unset, defaults to `true` in
 * `development` only; set `1`/`true` in other envs to migrate on boot, or run
 * `pnpm db:push` / `drizzle-kit migrate` as a separate release step (preferred
 * for production).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — R-NF-5
 */
import path from "node:path";
import { z } from "zod";

function optTruthy(envVal: string | undefined): boolean {
  if (envVal === undefined) return false;
  const v = envVal.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

const schema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  /** SQLite file path. Required when `NODE_ENV=production`. */
  DATABASE_PATH: z.string().min(1).optional(),
  /** Initial static flags; remote providers can wrap this later (R-NF-4). */
  FEATURE_CHECKOUT_V2: z.string().optional(),
  FEATURE_ASYNC_CAPTURE: z.string().optional(),
  /**
   * Apply Drizzle SQL migrations before accepting traffic. Default: on in
   * `development` only; override with `0`/`false` or `1`/`true`.
   */
  MIGRATIONS_ON_START: z.string().optional(),
  /** When truthy, skip loading the `core-defaults` plugin. */
  PLUGIN_CORE_DEFAULTS_DISABLED: z.string().optional(),
  /**
   * Shared secret for `GET /admin/.../status` and other admin-only routes.
   * Send `Authorization: Bearer <key>` or `X-Admin-Key: <key>`.
   */
  ADMIN_API_KEY: z.string().optional(),
  /** Stripe secret key (`sk_…`) for PaymentIntents. */
  STRIPE_SECRET_KEY: z.string().optional(),
  /** Webhook signing secret (`whsec_…`) for `POST /webhooks/stripe`. */
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  /**
   * When set, shop mutating routes require `X-Shop-Key` or `Authorization: Bearer`.
   * Leave unset for local MVP; set in shared demo/staging.
   */
  SHOP_API_KEY: z.string().optional(),
  /** CORS `Access-Control-Allow-Origin` (e.g. `http://localhost:3000`). Empty = no CORS middleware. */
  CORS_ORIGIN: z.string().optional(),
  /** Shop-wide discount in basis points (100 = 1%). Omit or `0` to disable. */
  PROMOTION_DISCOUNT_BPS: z.string().optional(),
  /**
   * Per-IP HTTP rate limit (requests per minute). Omit for default 300; `0` disables limiting.
   */
  RATE_LIMIT_PER_MINUTE: z.string().optional(),
  /** When `X-Tenant-Id` is absent, use this tenant id (optional; null if unset). */
  DEFAULT_TENANT_ID: z.string().optional(),
  /** OIDC issuer URL (e.g. https://example.clerk.accounts.dev). */
  OIDC_ISSUER: z.string().optional(),
  /** OIDC audience expected in access tokens. */
  OIDC_AUDIENCE: z.string().optional(),
  /** OIDC JWKS endpoint URL. */
  OIDC_JWKS_URL: z.string().optional(),
  /** Redis URL for queue/events (BullMQ). */
  REDIS_URL: z.string().optional(),
  /** Meilisearch endpoint URL. */
  MEILI_URL: z.string().optional(),
  /** Meilisearch admin/search API key. */
  MEILI_KEY: z.string().optional(),
  /** Shipping provider API key (Shippo/EasyPost depending on adapter). */
  SHIPPING_API_KEY: z.string().optional(),
});

export type Env = {
  readonly nodeEnv: "development" | "staging" | "production";
  readonly port: number;
  readonly databasePath: string;
  readonly featureFlags: Record<string, boolean>;
  readonly applyMigrationsOnStart: boolean;
  readonly pluginCoreDefaultsDisabled: boolean;
  readonly adminApiKey: string | undefined;
  readonly stripeSecretKey: string | undefined;
  readonly stripeWebhookSecret: string | undefined;
  readonly shopApiKey: string | undefined;
  readonly corsOrigin: string | undefined;
  readonly promotionDiscountBps: bigint | undefined;
  readonly rateLimitPerMinute: number | undefined;
  readonly defaultTenantId: string | undefined;
  readonly oidcIssuer: string | undefined;
  readonly oidcAudience: string | undefined;
  readonly oidcJwksUrl: string | undefined;
  readonly redisUrl: string | undefined;
  readonly meiliUrl: string | undefined;
  readonly meiliKey: string | undefined;
  readonly shippingApiKey: string | undefined;
};

/**
 * Parse `process.env` (or overrides for tests). Throws {@link z.ZodError} or `Error` on failure.
 */
export function parseEnv(env: NodeJS.ProcessEnv = process.env): Env {
  const p = schema.parse(env);
  if (p.NODE_ENV === "production" && p.DATABASE_PATH === undefined) {
    throw new Error("DATABASE_PATH is required when NODE_ENV=production (R-NF-5)");
  }
  const databasePath =
    p.DATABASE_PATH ?? path.resolve(process.cwd(), "packages/persistence-drizzle/data.sqlite");

  const applyMigrationsOnStart =
    p.MIGRATIONS_ON_START !== undefined && p.MIGRATIONS_ON_START.trim() !== ""
      ? optTruthy(p.MIGRATIONS_ON_START)
      : p.NODE_ENV === "development";

  const adminApiKey =
    p.ADMIN_API_KEY !== undefined && p.ADMIN_API_KEY.trim() !== "" ? p.ADMIN_API_KEY.trim() : undefined;
  const stripeSecretKey =
    p.STRIPE_SECRET_KEY !== undefined && p.STRIPE_SECRET_KEY.trim() !== ""
      ? p.STRIPE_SECRET_KEY.trim()
      : undefined;
  const stripeWebhookSecret =
    p.STRIPE_WEBHOOK_SECRET !== undefined && p.STRIPE_WEBHOOK_SECRET.trim() !== ""
      ? p.STRIPE_WEBHOOK_SECRET.trim()
      : undefined;
  const shopApiKey =
    p.SHOP_API_KEY !== undefined && p.SHOP_API_KEY.trim() !== "" ? p.SHOP_API_KEY.trim() : undefined;
  const corsOrigin =
    p.CORS_ORIGIN !== undefined && p.CORS_ORIGIN.trim() !== "" ? p.CORS_ORIGIN.trim() : undefined;

  let promotionDiscountBps: bigint | undefined;
  if (p.PROMOTION_DISCOUNT_BPS !== undefined && p.PROMOTION_DISCOUNT_BPS.trim() !== "") {
    try {
      const b = BigInt(p.PROMOTION_DISCOUNT_BPS.trim());
      if (b < 0n || b > 10_000n) {
        throw new Error("PROMOTION_DISCOUNT_BPS must be between 0 and 10000 (basis points)");
      }
      promotionDiscountBps = b === 0n ? undefined : b;
    } catch (e) {
      throw new Error(
        `Invalid PROMOTION_DISCOUNT_BPS: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  let rateLimitPerMinute: number | undefined;
  if (p.RATE_LIMIT_PER_MINUTE !== undefined && p.RATE_LIMIT_PER_MINUTE.trim() !== "") {
    const n = Number.parseInt(p.RATE_LIMIT_PER_MINUTE.trim(), 10);
    if (Number.isNaN(n) || n < 0) {
      throw new Error("RATE_LIMIT_PER_MINUTE must be a non-negative integer");
    }
    rateLimitPerMinute = n;
  }

  const defaultTenantId =
    p.DEFAULT_TENANT_ID !== undefined && p.DEFAULT_TENANT_ID.trim() !== ""
      ? p.DEFAULT_TENANT_ID.trim()
      : undefined;
  const oidcIssuer = p.OIDC_ISSUER?.trim() ? p.OIDC_ISSUER.trim() : undefined;
  const oidcAudience = p.OIDC_AUDIENCE?.trim() ? p.OIDC_AUDIENCE.trim() : undefined;
  const oidcJwksUrl = p.OIDC_JWKS_URL?.trim() ? p.OIDC_JWKS_URL.trim() : undefined;
  const redisUrl = p.REDIS_URL?.trim() ? p.REDIS_URL.trim() : undefined;
  const meiliUrl = p.MEILI_URL?.trim() ? p.MEILI_URL.trim() : undefined;
  const meiliKey = p.MEILI_KEY?.trim() ? p.MEILI_KEY.trim() : undefined;
  const shippingApiKey = p.SHIPPING_API_KEY?.trim() ? p.SHIPPING_API_KEY.trim() : undefined;

  return {
    nodeEnv: p.NODE_ENV,
    port: p.PORT,
    databasePath,
    featureFlags: {
      checkout_v2: optTruthy(p.FEATURE_CHECKOUT_V2),
      async_capture: optTruthy(p.FEATURE_ASYNC_CAPTURE),
    },
    applyMigrationsOnStart,
    pluginCoreDefaultsDisabled: optTruthy(p.PLUGIN_CORE_DEFAULTS_DISABLED),
    adminApiKey,
    stripeSecretKey,
    stripeWebhookSecret,
    shopApiKey,
    corsOrigin,
    promotionDiscountBps,
    rateLimitPerMinute,
    defaultTenantId,
    oidcIssuer,
    oidcAudience,
    oidcJwksUrl,
    redisUrl,
    meiliUrl,
    meiliKey,
    shippingApiKey,
  };
}
