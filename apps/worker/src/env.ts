/**
 * Worker env (SQLite path matches core-api for shared local file).
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
  DATABASE_PATH: z.string().min(1).optional(),
  WORKER_TICK_MS: z.coerce.number().int().positive().max(300_000).default(2000),
  WORKER_OUTBOX_BATCH: z.coerce.number().int().positive().max(500).default(50),
  /** When set, worker marks `authorized` payments as `captured` (demo PSP behavior). */
  FEATURE_ASYNC_CAPTURE: z.string().optional(),
  REDIS_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  SHIPPING_API_KEY: z.string().optional(),
  MEILI_URL: z.string().optional(),
  MEILI_KEY: z.string().optional(),
});

export type WorkerEnv = {
  readonly nodeEnv: "development" | "staging" | "production";
  readonly databasePath: string;
  readonly tickMs: number;
  readonly outboxBatch: number;
  readonly asyncCapture: boolean;
  readonly redisUrl: string | undefined;
  readonly stripeSecretKey: string | undefined;
  readonly shippingApiKey: string | undefined;
  readonly meiliUrl: string | undefined;
  readonly meiliKey: string | undefined;
};

export function parseWorkerEnv(env: NodeJS.ProcessEnv = process.env): WorkerEnv {
  const p = schema.parse(env);
  if (p.NODE_ENV === "production" && p.DATABASE_PATH === undefined) {
    throw new Error("DATABASE_PATH is required when NODE_ENV=production");
  }
  const databasePath =
    p.DATABASE_PATH ?? path.resolve(process.cwd(), "packages/persistence-drizzle/data.sqlite");
  return {
    nodeEnv: p.NODE_ENV,
    databasePath,
    tickMs: p.WORKER_TICK_MS,
    outboxBatch: p.WORKER_OUTBOX_BATCH,
    asyncCapture: optTruthy(p.FEATURE_ASYNC_CAPTURE),
    redisUrl: p.REDIS_URL?.trim() ? p.REDIS_URL.trim() : undefined,
    stripeSecretKey: p.STRIPE_SECRET_KEY?.trim() ? p.STRIPE_SECRET_KEY.trim() : undefined,
    shippingApiKey: p.SHIPPING_API_KEY?.trim() ? p.SHIPPING_API_KEY.trim() : undefined,
    meiliUrl: p.MEILI_URL?.trim() ? p.MEILI_URL.trim() : undefined,
    meiliKey: p.MEILI_KEY?.trim() ? p.MEILI_KEY.trim() : undefined,
  };
}
