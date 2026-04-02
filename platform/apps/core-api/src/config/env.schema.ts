/**
 * Environment variable validation (e.g. Zod).
 *
 * Requirements:
 * - R-NF-5: Secrets only from env or a secret manager; mark sensitive fields in schema; no real secrets in defaults.
 * - Distinguish `development` / `staging` / `production`; refuse to start in prod if required vars are missing.
 *
 * TODO:
 * - [ ] Define `DATABASE_URL`, `REDIS_URL`, payment/search API keys, etc.; document optional fields and defaults.
 * - [ ] Export `parseEnv()`: on success return typed `Env`; on failure throw or return `Result`.
 * - [ ] Share the same schema with worker and BFFs (extract to a shared config package if needed).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — R-NF-5
 */
export function parseEnv(): never {
  throw new Error("TODO: env.schema parseEnv — see file header JSDoc");
}
