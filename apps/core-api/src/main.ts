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
 * - [ ] Parse and validate env via `config/env.schema`; exit non-zero on failure.
 * - [ ] Call `http/server` to listen; graceful shutdown on SIGTERM/SIGINT (drain + timeout).
 * - [ ] Expose liveness (no deps) and readiness (DB/redis, etc.) routes or port (per kernel contract).
 * - [ ] Register global Idempotency-Key handling for mutating handlers (checkout, payment, etc.; R-NF-1).
 * - [ ] Separate public storefront vs admin route prefixes, auth, and rate limits (SERIES-B apps table).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Apps core-api, Global R-NF-*
 */
export function main(): never {
  // TODO: import bootstrap from kernel, start http/server
  throw new Error("TODO: core-api main — see file header JSDoc");
}
