/**
 * Stable fingerprint for idempotent POST bodies (method + path + JSON body).
 */
import { createHash } from "node:crypto";
import type { Request } from "express";

export function requestFingerprint(req: Request): string {
  const path = `${req.baseUrl}${req.path}`;
  const body = JSON.stringify(req.body ?? {});
  return createHash("sha256").update(`${req.method}:${path}:${body}`).digest("hex");
}
