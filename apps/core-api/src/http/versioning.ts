/**
 * API versioning: path version, deprecation headers, Sunset.
 *
 * Requirements:
 * - Breaking changes must bump version; old versions remain available for a documented window.
 * - Responses may include `Deprecation` / `Sunset` (e.g. RFC 8594 style).
 *
 * ## Version matrix (update when handlers or contracts break)
 *
 * | Path prefix        | Status   | Notes                          |
 * | ------------------ | -------- | ------------------------------ |
 * | `/admin/v1`, `/store/v1` | current  | Primary HTTP API surfaces      |
 * | _(future `/v2`)_   | planned  | Bump {@link API_VERSION} first |
 *
 * TODO:
 * - [ ] Metrics for requests hitting deprecated route trees.
 * - [ ] Accept-Version / vendor MIME negotiation if you outgrow path versioning.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — apps/core-api http/versioning
 */
import type { RequestHandler } from "express";

/** Current primary API segment (path suffix under each surface). */
export const API_VERSION = "v1" as const;

/** `"/v1"` — use {@link withApiVersion} to append to a surface prefix. */
export function apiVersionPath(version: string = API_VERSION): string {
  return `/${version}`;
}

/**
 * Append a version segment to a mount path: `/admin` + `v1` → `/admin/v1`.
 * Trailing slashes on `surfaceMount` are stripped before joining.
 */
export function withApiVersion(
  surfaceMount: string,
  version: string = API_VERSION,
): string {
  const base = surfaceMount.replace(/\/+$/, "");
  const seg = version.replace(/^\/+|\/+$/g, "");
  return `${base}/${seg}`;
}

/**
 * Express middleware: set RFC 8594-style deprecation headers on a route tree.
 * Use on routers you plan to remove after {@link opts.sunset}.
 */
export function deprecationHeadersMiddleware(opts: {
  readonly deprecation?: string;
  readonly sunset?: string;
  /** If true, log one warning per process (optional hook for metrics). */
  readonly warnOnceKey?: string;
}): RequestHandler {
  let warned = false;
  return (_req, res, next) => {
    if (opts.deprecation !== undefined) {
      res.setHeader("Deprecation", opts.deprecation);
    }
    if (opts.sunset !== undefined) {
      res.setHeader("Sunset", opts.sunset);
    }
    if (opts.warnOnceKey !== undefined && !warned) {
      warned = true;
      // TODO: emit metric / structured log with warnOnceKey
    }
    next();
  };
}
