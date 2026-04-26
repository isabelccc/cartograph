/**
 * Plugin entry: core-defaults — demo routes (plugin surface + idempotent POST).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Plugins
 */
import { Router } from "express";
import { requestFingerprint } from "../../../packages/api-rest/src/request-fingerprint.js";
import { DomainError } from "../../../packages/domain-contracts/src/errors.js";
import type { CommercePlugin } from "../../../packages/kernel/src/plugin.types.js";
import type { AppDb } from "../../../packages/persistence-drizzle/src/client.js";
import {
  createIdempotencyStore,
  ensureIdempotencyTable,
} from "../../../packages/persistence-drizzle/src/idempotency-store.js";

/** Must match mounted path: POST {shopMount}/demo/commits */
const DEMO_COMMIT_SCOPE = "POST /store/v1/demo/commits";

export function createCoreDefaultsPlugin(): CommercePlugin {
  return {
    name: "core-defaults",
    version: "0.0.0",
    registerRoutes(ctx) {
      const { shopRouter, asyncHandler: ah, db } = ctx;
      const r = Router();

      r.get("/plugin/core-defaults", (req, res) => {
        res.json({
          ok: true,
          plugin: "core-defaults",
          requestId: req.requestId,
        });
      });

      r.post(
        "/demo/commits",
        ah(async (req, res) => {
          const dbh = db as AppDb | undefined;
          if (dbh === undefined) {
            throw new DomainError("PERSISTENCE_UNAVAILABLE", "database is not configured");
          }
          ensureIdempotencyTable(dbh);
          const store = createIdempotencyStore(dbh);

          const raw = req.header("Idempotency-Key") ?? req.header("idempotency-key");
          if (raw === undefined || raw.trim() === "") {
            throw new DomainError(
              "IDEMPOTENCY_KEY_REQUIRED",
              "Idempotency-Key header is required for this endpoint",
            );
          }
          const idemKey = raw.trim();
          const fp = requestFingerprint(req);

          const hit = store.get(DEMO_COMMIT_SCOPE, idemKey);
          if (hit !== undefined) {
            if (hit.fingerprint !== fp) {
              throw new DomainError(
                "IDEMPOTENCY_KEY_CONFLICT",
                "Idempotency-Key was reused with a different request payload",
              );
            }
            res.status(hit.statusCode).setHeader("Content-Type", hit.contentType);
            res.send(hit.body);
            return;
          }

          const body = {
            ok: true,
            surface: "store",
            demo: "commit",
            requestId: req.requestId,
          };
          const serialized = JSON.stringify(body);
          res.status(201).json(body);
          store.save(
            DEMO_COMMIT_SCOPE,
            idemKey,
            fp,
            201,
            "application/json; charset=utf-8",
            serialized,
          );
        }),
      );

      shopRouter.use(r);
    },
  };
}
