/**
 * HTTP server (Fastify / Express) and graceful shutdown.
 *
 * Requirements:
 * - R-NF-1: Mutating handlers that can be duplicated must read `Idempotency-Key` and interact with storage.
 * - R-NF-3: Global error handler maps DomainError → HTTP status + stable `code`; never expose stack.
 * - Set sensible body size limits, CORS, and timeouts.
 *
 * TODO:
 * - [ ] Mount versioning (see versioning.ts): `/v1` prefix or Accept-Version.
 *
 * **Note:** Async handlers should use `asyncHandler` from `api-rest` so rejections reach the error boundary.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — R-NF-1, R-NF-3, Apps core-api
 */
import type { Server } from "node:http";
import type { CreatedApp } from "../app.js";

export type HttpServerOptions = {
  readonly port?: number;
  readonly host?: string;
};

/** Lifecycle handle: start listening, then close Node server + app resources. */
export type HttpServerHandle = {
  readonly listen: () => Promise<void>;
  readonly close: () => Promise<void>;
};

function resolvePort(explicit?: number): number {
  if (explicit !== undefined) {
    return explicit;
  }
  const fromEnv = Number(process.env.PORT);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 3000;
}

/**
 * Wrap a composed Express app: call {@link HttpServerHandle.listen} after {@link CreatedApp.ready} (called here),
 * then {@link HttpServerHandle.close} on shutdown.
 */
export function createHttpServer(
  createdApp: CreatedApp,
  options?: HttpServerOptions,
): HttpServerHandle {
  const port = resolvePort(options?.port);
  const host = options?.host ?? "0.0.0.0";
  let server: Server | undefined;

  return {
    async listen() {
      await createdApp.ready();
      await new Promise<void>((resolve, reject) => {
        server = createdApp.express.listen(port, host, () => resolve());
        server.on("error", (err: NodeJS.ErrnoException) => {
          if (err.code === "EADDRINUSE") {
            reject(
              new Error(
                `Port ${port} is already in use on ${host}. ` +
                  `Set PORT to a free port (e.g. PORT=3001 npm run dev) or stop the other listener (macOS: lsof -i :${port}).`,
              ),
            );
            return;
          }
          reject(err);
        });
      });
    },

    async close() {
      await new Promise<void>((resolve, reject) => {
        if (server === undefined) {
          resolve();
          return;
        }
        server.close((err) => (err ? reject(err) : resolve()));
      });
      server = undefined;
      await createdApp.close();
    },
  };
}
