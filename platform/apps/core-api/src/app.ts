/**
 * Compose plugins, mount routes, merge API extensions (Vendure-style app layer).
 *
 * Requirements:
 * - Aggregate routes / services / workflows registered in the plugin manifest.
 * - Separate mount paths for Admin API vs Shop API (e.g. `/admin` vs `/store`).
 *
 * TODO:
 * - [ ] Load plugins from `plugins.manifest` and `configure` in dependency order.
 * - [ ] Mount each plugin’s REST/GraphQL (if enabled) on the same HTTP instance.
 * - [ ] Inject shared context: logger, db, featureFlags, tenant resolver.
 * - [ ] Single error boundary: domain errors → RFC 7807 or agreed JSON (see api-rest/problem-json).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Kernel, Plugins
 */
export function createApp(): never {
  throw new Error("TODO: core-api createApp — see file header JSDoc");
}
