/**
 * Persist idempotent POST responses (R-NF-1) when `Idempotency-Key` is present.
 */
import type { Request, Response } from "express";
import { DomainError } from "../../../../packages/domain-contracts/src/errors.js";
import { requestFingerprint } from "../../../../packages/api-rest/src/request-fingerprint.js";
import type { AppDb } from "../../../../packages/persistence-drizzle/src/client.js";
import {
  createIdempotencyStore,
  ensureIdempotencyTable,
} from "../../../../packages/persistence-drizzle/src/idempotency-store.js";
import type { NextFunction, RequestHandler } from "express";

function jsonStableWithBigInt(value: unknown): string {
  return JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
}

export function createRequireIdempotencyKeyForPost(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.method !== "POST") {
      next();
      return;
    }
    const key = req.header("idempotency-key")?.trim();
    if (key === undefined || key.length === 0) {
      next(
        new DomainError(
          "IDEMPOTENCY_KEY_REQUIRED",
          "Send Idempotency-Key on this POST to safely retry the request.",
        ),
      );
      return;
    }
    next();
  };
}

/**
 * When `Idempotency-Key` is set, replay a prior identical request or store this response.
 * Call inside `asyncHandler` after `createRequireIdempotencyKeyForPost` if keys are mandatory.
 */
export async function withIdempotency(
  db: AppDb,
  scope: string,
  req: Request,
  res: Response,
  run: () => Promise<void>,
): Promise<void> {
  ensureIdempotencyTable(db);
  const store = createIdempotencyStore(db);
  const key = req.header("idempotency-key")?.trim();
  if (key === undefined || key.length === 0) {
    await run();
    return;
  }
  const fp = requestFingerprint(req);
  const fullScope = `${scope}:${req.tenantId ?? "global"}`;
  const hit = store.get(fullScope, key);
  if (hit !== undefined) {
    if (hit.fingerprint !== fp) {
      throw new DomainError(
        "IDEMPOTENCY_CONFLICT",
        "Idempotency key was reused with a different request body.",
      );
    }
    res.status(hit.statusCode).type(hit.contentType).send(hit.body);
    return;
  }

  let capturedStatus = 200;
  const origStatus = res.status.bind(res);
  res.status = (code: number): Response => {
    capturedStatus = code;
    return origStatus(code);
  };
  const origJson = res.json.bind(res);
  res.json = (body?: unknown): Response => {
    store.save(fullScope, key, fp, capturedStatus, "application/json", jsonStableWithBigInt(body));
    return origJson(body);
  };

  await run();
}
