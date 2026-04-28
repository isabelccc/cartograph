/**
 * **`GET /ready`** (also mounted under `/admin/v1/ready`, `/store/v1/ready`) — **readiness** not liveness.
 *
 * Runs `SELECT 1` on SQLite; **503** if DB missing or query fails (K8s should not route traffic).
 * Deep dive: **`GET /health`** is cheaper (no DB ping) — see routers in `register-*-routes`.
 */
import type { Request, Response } from "express";
import type { AppDb } from "../../../../packages/persistence-drizzle/src/client.js";

export async function readyHandler(req: Request, res: Response): Promise<void> {
  const db = req.app.locals.ctx.db as AppDb | undefined;
  if (db === undefined) {
    res.status(503).json({
      ok: false,
      checks: { db: "missing" },
      requestId: req.requestId,
    });
    return;
  }
  try {
    db.$client.prepare("SELECT 1").get();
    res.status(200).json({
      ok: true,
      checks: { db: "ok" },
      requestId: req.requestId,
    });
  } catch {
    res.status(503).json({
      ok: false,
      checks: { db: "error" },
      requestId: req.requestId,
    });
  }
}
