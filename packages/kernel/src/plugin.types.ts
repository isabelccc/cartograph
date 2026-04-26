/**
 * Plugin and API extension declarations (no heavy runtime).
 *
 * Requirements:
 * - `CommercePlugin`: name, version, optional `registerRoutes`.
 * - Plugins must not bypass ports for persistence (R-DOM-1).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Kernel
 */
import type { IRouter, NextFunction, Request, RequestHandler, Response } from "express";

export type AsyncPluginHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export type CommercePluginRouteContext = {
  readonly adminRouter: IRouter;
  readonly shopRouter: IRouter;
  /** Express 4 async wrapper — rejections become `next(err)`. */
  readonly asyncHandler: (fn: AsyncPluginHandler) => RequestHandler;
  /** Drizzle `AppDb` when persistence is enabled (typed as unknown to keep kernel DB-agnostic). */
  readonly db: unknown;
};

export type CommercePlugin = {
  readonly name: string;
  readonly version: string;
  registerRoutes?(ctx: CommercePluginRouteContext): void;
};
