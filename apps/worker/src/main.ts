/**
 * Worker process entry (queue consumers can be added later).
 */
import { fileURLToPath } from "node:url";

export async function main(): Promise<void> {
  // Keep process alive; replace with BullMQ / pg-boss consumer registration.
  // eslint-disable-next-line no-console
  console.log("[worker] standby — no job queue connected (see apps/worker TODO)");
  await new Promise<void>((resolve) => {
    process.once("SIGINT", () => resolve());
    process.once("SIGTERM", () => resolve());
  });
  // eslint-disable-next-line no-console
  console.log("[worker] shutdown");
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
