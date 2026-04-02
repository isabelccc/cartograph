/**
 * Ordered init: config → db → migrations → plugins → http (when wired).
 *
 * Requirements:
 * - R-NF-4: Forward-only migrations in production.
 * - Health: liveness vs readiness (DB + redis).
 *
 * TODO:
 * - [ ] Implement ordered steps with clear failure semantics.
 * - [ ] Return a context object passed to apps/core-api.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Kernel
 */
export function bootstrap(): never {
  throw new Error("TODO: bootstrap — see file header JSDoc");
}

