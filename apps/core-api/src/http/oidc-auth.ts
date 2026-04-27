import type { NextFunction, Request, Response } from "express";
import { DomainError } from "../../../../packages/domain-contracts/src/errors.js";
import type { OidcVerifier } from "../../../../packages/authz/src/oidc.js";

export function createOptionalOidcAuth(verifier: OidcVerifier | undefined) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authz = req.header("authorization");
    const m = authz?.match(/^Bearer\s+(\S+)$/i);
    const token = m?.[1];
    if (verifier === undefined || token === undefined) {
      next();
      return;
    }
    try {
      const identity = await verifier.verifyJwt(token);
      req.identity = identity;
      if (identity.tenantId !== null) {
        req.tenantId = identity.tenantId;
      }
      if (identity.role === "admin") {
        req.actorKind = "admin";
      } else {
        req.actorKind = "shop";
      }
      next();
    } catch (e) {
      next(new DomainError("UNAUTHENTICATED", `Invalid OIDC token: ${String(e)}`));
    }
  };
}
