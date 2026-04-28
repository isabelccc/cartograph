/**
 * **Per-request middleware** — runs early (after JSON parser) so all handlers share:
 *
 * - **`X-Request-Id`** (or generated UUID) echoed on response.
 * - **`req.tenantId`** from `AppContext.resolveTenant(req)` — base for multi-tenant + admin RBAC.
 * - **`req.actorKind`** starts `anonymous`; admin/shop/OIDC middleware may raise it.
 * - **`req.log`** structured child logger; `finish` hook increments HTTP metrics.
 *
 * Deep dive: **tenant is null** until header/default resolver sets it — many admin routes then fail with `TENANT_REQUIRED`.
 */
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { RequestLogger } from "../config/logger.js";
import { createRequestLogger } from "../config/logger.js";
import type { ActorKind } from "../../../../packages/authz/src/policies.js";
import type { VerifiedIdentity } from "../../../../packages/authz/src/oidc.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      tenantId: string | null;
      /** Set after admin/shop auth middleware; default `anonymous`. */
      actorKind: ActorKind;
      identity?: VerifiedIdentity | undefined;
      log: RequestLogger;
    }
  }
}

export function requestContextMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const ctx = req.app.locals.ctx;
    const fromHeader = req.header("x-request-id")?.trim();
    const requestId = fromHeader && fromHeader.length > 0 ? fromHeader : randomUUID();
    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);

    const tenantId = ctx.resolveTenant(req);
    req.tenantId = tenantId;
    req.actorKind = "anonymous";

    req.log = createRequestLogger({
      requestId,
      ...(tenantId !== null ? { tenantId } : {}),
    });

    const started = Date.now();
    res.on("finish", () => {
      ctx.metrics?.inc("http.requests");
      ctx.metrics?.observe("http.request_duration_ms", Date.now() - started);
    });

    next();
  };
}
