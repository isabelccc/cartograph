/**
 * Thin BFF entry for Next.js (optional).
 *
 * Requirements:
 * - Optional aggregation of storefront calls; cache product lists where safe.
 * - R-NF-2: Propagate requestId; R-NF-3: No stack leaks to clients.
 *
 * TODO:
 * - [ ] Bootstrap HTTP client(s) to core-api with timeouts and retries.
 * - [ ] Define route modules under routes/ for SSR or route handlers.
 * - [ ] Document cache TTL and invalidation rules in comments when implemented.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Apps — storefront-bff
 */
export function main(): never {
  throw new Error("TODO: main — see file header JSDoc");
}

