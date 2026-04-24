/**
 * Environment variable validation (Zod).
 *
 * Requirements:
 * - R-NF-5: Secrets only from env; no real secrets in defaults.
 * - Refuse to start in production if required vars are missing.
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
});

export type Env = {
  readonly nodeEnv: "development" | "staging" | "production";
  readonly port: number;
  readonly databasePath: string;
  readonly featureFlags: Record<string, boolean>;
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
  return {
    nodeEnv: p.NODE_ENV,
    port: p.PORT,
    databasePath,
    featureFlags: {
      checkout_v2: optTruthy(p.FEATURE_CHECKOUT_V2),
      async_capture: optTruthy(p.FEATURE_ASYNC_CAPTURE),
    },
  };
}
