/**
 * HTTP server (Fastify / Express) and graceful shutdown.
 *
 * Requirements:
 * - R-NF-1: Mutating handlers that can be duplicated must read `Idempotency-Key` and interact with storage.
 * - R-NF-3: Global error handler maps DomainError → HTTP status + stable `code`; never expose stack.
 * - Set sensible body size limits, CORS, and timeouts.
 *
 * TODO:
 * - [ ] `createServer()` returns a listenable instance + `close()` Promise.
 * - [ ] Mount versioning (see versioning.ts): `/v1` prefix or Accept-Version.
 * - [ ] Integrate the route tree produced by `app.ts`.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — R-NF-1, R-NF-3, Apps core-api
 */
export function createHttpServer(): never {
  throw new Error("TODO: http/server — see file header JSDoc");
}
