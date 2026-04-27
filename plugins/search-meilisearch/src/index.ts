/**
 * Meilisearch plugin.
 */
import type { CommercePlugin } from "../../../packages/kernel/src/plugin.types.js";
import { Meilisearch } from "meilisearch";

export function createPlugin(): CommercePlugin {
  const host = process.env.MEILI_URL?.trim();
  const apiKey = process.env.MEILI_KEY?.trim();
  return {
    name: "search-meilisearch",
    version: "0.0.0",
    registerRoutes(ctx) {
      ctx.shopRouter.get(
        "/search/status",
        ctx.asyncHandler(async (_req, res) => {
          if (host === undefined) {
            res.status(200).json({ ok: false, reason: "MEILI_URL not configured" });
            return;
          }
          const client = new Meilisearch({ host, apiKey });
          const health = await client.health();
          res.status(200).json({ ok: health.status === "available", status: health.status });
        }),
      );
    },
  };
}
