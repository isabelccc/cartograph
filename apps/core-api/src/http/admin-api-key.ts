/**
 * Verifies `ADMIN_API_KEY` via `Authorization: Bearer …` or `X-Admin-Key`.
 */
import type { NextFunction, Request, Response } from "express";
import { DomainError } from "../../../../packages/domain-contracts/src/errors.js";
import type { ProblemDocument } from "../../../../packages/api-rest/src/problem-json.js";

export function createRequireAdminApiKey(adminApiKey: string | undefined) {
  return function requireAdminApiKey(req: Request, res: Response, next: NextFunction): void {
    if (adminApiKey === undefined) {
      const body: ProblemDocument = {
        type: "about:blank",
        title: "ADMIN_AUTH_NOT_CONFIGURED",
        status: 503,
        detail: "Set ADMIN_API_KEY in the environment to use protected admin routes.",
        code: "ADMIN_AUTH_NOT_CONFIGURED",
      };
      res.status(503).type("application/problem+json").json(body);
      return;
    }
    const authz = req.header("authorization");
    const m = authz?.match(/^Bearer\s+(\S+)$/i);
    const token = m?.[1] ?? req.header("x-admin-key")?.trim();
    if (token === undefined || token !== adminApiKey) {
      next(
        new DomainError(
          "ADMIN_UNAUTHENTICATED",
          "Invalid or missing admin API key (use Authorization: Bearer or X-Admin-Key).",
        ),
      );
      return;
    }
    req.actorKind = "admin";
    next();
  };
}
