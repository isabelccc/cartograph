/**
 * **Cross-cutting Express middleware** extracted from `app.ts` for readability.
 *
 * - **`installErrorBoundary`:** maps `DomainError` → RFC7807-style `application/problem+json`;
 *   hides stack traces from clients (R-NF-3).
 * - **`requireAction`:** RBAC gate — `authorize(actorKind, action)` + **tenant required** for admin-class actions.
 *   Used on specific routes (e.g. `/admin/v1/status`), not on every admin route (see `register-admin` blanket middleware).
 */
import type { Application, NextFunction, Request, Response } from "express";
import {
  problemFromDomainError,
  problemInternalServerError,
} from "../../../../packages/api-rest/src/problem-json.js";
import { Actions } from "../../../../packages/authz/src/policies.js";
import { authorize } from "../../../../packages/authz/src/authorize.js";
import { DomainError } from "../../../../packages/domain-contracts/src/errors.js";

export function installErrorBoundary(app: Application): void {
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const ctx = req.app.locals.ctx;
    const log = req.log ?? ctx.logger;
    if (err instanceof DomainError) {
      const problem = problemFromDomainError(err);
      res.status(problem.status).type("application/problem+json").json(problem);
      return;
    }
    log.error("unhandled_error", {
      path: req.path,
      err: err instanceof Error ? err.message : String(err),
    });
    const problem = problemInternalServerError();
    res.status(problem.status).type("application/problem+json").json(problem);
  });
}

export function requireAction(action: (typeof Actions)[keyof typeof Actions]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!authorize(req.actorKind, action)) {
      next(new DomainError("FORBIDDEN", `Action not allowed: ${action}`));
      return;
    }
    if ((action === Actions.ADMIN_READ || action === Actions.ADMIN_WRITE) && req.tenantId === null) {
      next(new DomainError("TENANT_REQUIRED", "Tenant is required for admin actions"));
      return;
    }
    next();
  };
}
