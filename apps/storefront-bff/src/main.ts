/**
 * Thin BFF for Next.js (minimal HTTP; proxy to core-api in production).
 */
import { fileURLToPath } from "node:url";
import express from "express";
import { registerCoreApiProxy } from "./proxy.js";
import { registerStorefrontRoutes } from "./routes/index.js";

const port = Number(process.env.PORT ?? 3002);

export async function main(): Promise<void> {
  const app = express();
  registerStorefrontRoutes(app);
  registerCoreApiProxy(app, { mountPath: "/api", corePrefix: "/store/v1" });
  app.use(express.json({ limit: "1mb" }));
  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, "127.0.0.1", () => {
      console.log(`storefront-bff http://127.0.0.1:${port}/health`);
    });
    server.on("error", reject);
    process.once("SIGINT", () => server.close(() => resolve()));
    process.once("SIGTERM", () => server.close(() => resolve()));
  });
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
