/**
 * Cursor + limit DTOs for list endpoints (keyset / opaque cursor pattern).
 *
 * ## Requirements
 *
 * - **R-PAGE-1 — Bounded page size:** List APIs enforce a **maximum `limit`** (default + cap).
 *   Reject or clamp out-of-range values; never allow unbounded `limit` from clients.
 * - **R-PAGE-2 — Stable ordering:** Cursors are only meaningful with a **documented, stable sort**
 *   (e.g. `(createdAt DESC, id DESC)`). The cursor must encode enough keyset fields to continue
 *   without duplicates/skips under normal concurrent writes.
 * - **R-PAGE-3 — Opaque cursors:** Clients treat `PageCursor` as opaque; do not depend on internal
 *   structure across releases. Version changes may invalidate old cursors (restart from first page).
 * - **R-PAGE-4 — Prefer keyset over deep offset:** Hot paths should use keyset continuation, not
 *   large `OFFSET`. If offset paging exists for admin tools, isolate and document it.
 * - **R-PAGE-5 — Abuse resistance:** Bound cursor string length and reject malformed payloads before
 *   heavy DB work.
 * - **R-PAGE-6 — HTTP mapping:** Map query params → `PageRequest`; map validation errors to stable
 *   `code` + 4xx (R-NF-3).
 *
 * ## TODO (your implementation)
 *
 * - [x] Default and max `limit` (`DEFAULT_LIMIT`, `MAX_LIMIT`); document in API spec.
 * - [ ] Choose cursor encoding (signed JSON, encrypted blob, DB-backed cursor id, etc.).
 * - [x] `normalizePageRequest` enforcing R-PAGE-1 / R-PAGE-5 (limit + cursor length).
 * - [ ] Repository/query helpers: decode cursor → `WHERE` keyset, return `nextCursor`.
 * - [ ] Document per-endpoint sort order next to each list route.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — domain-contracts
 */
import { DomainError } from "./errors.js";
import crypto from "crypto";
const CURSOR_SECRET = process.env.CURSOR_SECRET!
export type PageCursor = string;

export type PageRequest = {
  readonly cursor?: PageCursor | undefined;
  readonly limit: number;
};

/** Response shape for paginated lists. */
export type PageResult<T> = {
  readonly items: readonly T[];
  readonly nextCursor?: PageCursor | undefined;
};

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const MAX_CURSOR_LENGTH = 512;

/** Unvalidated input (e.g. from query strings) before normalization. */
export type RawPageRequest = {
  readonly cursor?: string | undefined;
  readonly limit?: number | undefined;
};

/**
 * Normalizes raw query input (R-PAGE-1, R-PAGE-5):
 * - `limit` omitted → `DEFAULT_LIMIT`.
 * - `limit` must be a finite integer; otherwise throws `PAGE_LIMIT_INVALID`.
 * - `limit` clamped to `[1, MAX_LIMIT]`.
 * - Optional `cursor` rejected if longer than `MAX_CURSOR_LENGTH`.
 */
export function normalizePageRequest(input: RawPageRequest): PageRequest {
  const { cursor } = input;

  if (cursor !== undefined && cursor.length > MAX_CURSOR_LENGTH) {
    throw new DomainError(
      "PAGE_CURSOR_TOO_LARGE",
      `cursor exceeds MAX_CURSOR_LENGTH (${MAX_CURSOR_LENGTH})`,
    );
  }

  const raw = input.limit;

  if (raw === undefined) {
    return { cursor, limit: DEFAULT_LIMIT };
  }

  if (!Number.isFinite(raw) || !Number.isInteger(raw)) {
    throw new DomainError(
      "PAGE_LIMIT_INVALID",
      "limit must be a finite integer",
    );
  }

  const limit = Math.min(Math.max(raw, 1), MAX_LIMIT);
  return { cursor, limit };
}

export function decodeCursor(cursor:string):Buffer{
    if (!CURSOR_SECRET) {
        throw new DomainError(
             "CURSOR_SECRET_INVALID",
              "CURSOR_SECRET is required");
      }

      const normalized = cursor.replace(/_/g, "+").replace(/-/g, "/");
      const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
      return Buffer.from(padded, "base64");
}
