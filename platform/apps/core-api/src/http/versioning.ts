/**
 * API versioning: path version, deprecation headers, Sunset.
 *
 * Requirements:
 * - Breaking changes must bump version; old versions remain available for a documented window.
 * - Responses may include `Deprecation` / `Sunset` (e.g. RFC 8594 style).
 *
 * TODO:
 * - [ ] Utilities for the current primary version `v1` route prefix.
 * - [ ] Middleware: log warnings and emit metrics for routes marked deprecated.
 * - [ ] Maintain a version matrix in comments mapping versions to handler sets.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — apps/core-api http/versioning
 */
export const API_VERSION = "v1" as const;

export function mountVersionedRoutes(): never {
  throw new Error("TODO: http/versioning — see file header JSDoc");
}
