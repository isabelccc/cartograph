/**
 * Admin UI BFF entry (optional).
 *
 * Requirements:
 * - Heavy reports may trigger async jobs (worker); do not block HTTP indefinitely.
 * - R-NF-5: Admin credentials and tokens only via env/secret manager.
 *
 * TODO:
 * - [ ] Mount admin-specific aggregations separate from public storefront.
 * - [ ] Integrate authz policies for admin scopes.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Apps — admin-bff
 */
export function main(): never {
  throw new Error("TODO: main — see file header JSDoc");
}

