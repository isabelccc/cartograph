/**
 * Admin BFF: lightweight health server (same SQLite as core-api for future admin routes).
 */
import { fileURLToPath } from "node:url";
import express from "express";
import { db } from "./db.js";
import { registerCoreApiProxy } from "./proxy.js";

const port = Number(process.env.PORT ?? 3001);

export async function main(): Promise<void> {
  const app = express();
  void db;
  registerCoreApiProxy(app, { mountPath: "/api", corePrefix: "/admin/v1" });
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, surface: "admin-bff" });
  });
  app.get("/ready", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, "127.0.0.1", () => {
      // eslint-disable-next-line no-console
      console.log(`admin-bff http://127.0.0.1:${port}/health`);
    });
    server.on("error", reject);
    process.once("SIGINT", () => {
      server.close(() => resolve());
    });
    process.once("SIGTERM", () => {
      server.close(() => resolve());
    });
  });
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
