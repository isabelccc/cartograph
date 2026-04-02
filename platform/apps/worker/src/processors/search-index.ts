/**
 * Bulk indexing for Meilisearch / Elasticsearch (or similar).
 *
 * Requirements:
 * - Consume catalog / inventory change events (preferably via outbox) to avoid stale reads.
 * - Idempotent updates: same document version must not corrupt the index.
 * - R-NF-7: Retries, DLQ, and alerting on persistent failures.
 *
 * TODO:
 * - [ ] Map domain DTOs to search documents; batch upsert/delete.
 * - [ ] Handle full reindex vs incremental (separate job type or flag).
 * - [ ] Rate-limit and backoff per provider limits; surface lag metrics.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Apps worker, SERIES-B search plugin
 */
export function registerSearchIndexProcessor(): never {
  throw new Error("TODO: search-index processor — see file header JSDoc");
}
