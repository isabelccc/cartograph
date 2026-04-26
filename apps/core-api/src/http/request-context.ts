/**
 * HTTP request context: requestId, tenantId, child logger (R-NF-2).
 */
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { RequestLogger } from "../config/logger.js";
import { createRequestLogger } from "../config/logger.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      tenantId: string | null;
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

    req.log = createRequestLogger({
      requestId,
      ...(tenantId !== null ? { tenantId } : {}),
    });

    next();
  };
}
