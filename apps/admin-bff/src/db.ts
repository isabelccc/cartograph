/**
 * Single place to construct the Drizzle handle for this app.
 * Import `db` from here — **not** from `main.ts`.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDrizzleClient, type AppDb } from "../../../packages/persistence-drizzle/src/client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** SQLite file next to persistence package (stable path regardless of process cwd). */
export const db: AppDb = createDrizzleClient(
  path.resolve(__dirname, "../../../packages/persistence-drizzle/data.sqlite"),
);
