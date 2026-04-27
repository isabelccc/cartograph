/**
 * Optional `SHOP_API_KEY`: when set, require `Authorization: Bearer` or `X-Shop-Key`
 * for mutating shop routes (POST/PUT/PATCH/DELETE).
 */
import type { NextFunction, Request, Response } from "express";
import { DomainError } from "../../../../packages/domain-contracts/src/errors.js";

export function createOptionalShopKeyForMutations(shopApiKey: string | undefined) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (shopApiKey === undefined) {
      next();
      return;
    }
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      next();
      return;
    }
    const m = req.header("authorization")?.match(/^Bearer\s+(\S+)$/i);
    const token = m?.[1] ?? req.header("x-shop-key")?.trim();
    if (token === undefined || token !== shopApiKey) {
      next(
        new DomainError(
          "SHOP_UNAUTHENTICATED",
          "Set X-Shop-Key or Authorization: Bearer to match SHOP_API_KEY when this env is set.",
        ),
      );
      return;
    }
    req.actorKind = "shop";
    next();
  };
}
