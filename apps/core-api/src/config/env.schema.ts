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
  };
}
