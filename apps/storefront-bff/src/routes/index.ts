/**
 * Storefront BFF route registration.
 */
import type { Express } from "express";

export function registerStorefrontRoutes(app: Express): void {
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, surface: "storefront-bff" });
  });
  app.get("/ready", (_req, res) => {
    res.status(200).json({ ok: true });
  });
}
