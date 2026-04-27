/**
 * Worker: periodic outbox drain, inventory TTL, capture/search hooks (expand with a real queue later).
 */
import { fileURLToPath } from "node:url";
import { openDrizzleSqlite } from "../../../packages/persistence-drizzle/src/client.js";
import { createOutboxWorker } from "../../../packages/events/src/queue.js";
import { parseWorkerEnv } from "./env.js";
import { runOutboxDispatchTick } from "./processors/outbox-dispatch.js";
import { runInventoryReservationTtlTick } from "./processors/inventory-reservation-ttl.js";
import { runPaymentCaptureTick } from "./processors/payment-capture.js";
import { runSearchIndexTick } from "./processors/search-index.js";
import { runLogisticsSyncTick } from "./processors/logistics-sync.js";

export async function main(): Promise<void> {
  const env = parseWorkerEnv();
  const sqlite = openDrizzleSqlite(env.databasePath);
  const db = sqlite.db;
  let stopping = false;
  const outboxWorker =
    env.redisUrl !== undefined
      ? createOutboxWorker(env.redisUrl, async (topic, payload) => {
          await runLogisticsSyncTick({
            shippingApiKey: env.shippingApiKey,
            topic,
            payload,
          });
          await runSearchIndexTick({
            meiliUrl: env.meiliUrl,
            meiliKey: env.meiliKey,
            topic,
            payload,
          });
        })
      : undefined;

  const tick = async (): Promise<void> => {
    if (stopping) {
      return;
    }
    try {
      const outbox = await runOutboxDispatchTick(db, env.outboxBatch, { redisUrl: env.redisUrl });
      const inventoryExpired = await runInventoryReservationTtlTick(db);
      const capture = env.asyncCapture
        ? await runPaymentCaptureTick(db, { stripeSecretKey: env.stripeSecretKey })
        : 0;
      const search = await runSearchIndexTick({ meiliUrl: env.meiliUrl, meiliKey: env.meiliKey });
      if (outbox + inventoryExpired + capture + search > 0) {
        // eslint-disable-next-line no-console
        console.log("[worker] tick", { outbox, inventoryExpired, capture, search });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[worker] tick error", err);
    }
  };

  // eslint-disable-next-line no-console
  console.log("[worker] started", {
    databasePath: env.databasePath,
    tickMs: env.tickMs,
    asyncCapture: env.asyncCapture,
    redisUrl: env.redisUrl ?? null,
  });
  const id = setInterval(() => void tick(), env.tickMs);
  await tick();

  await new Promise<void>((resolve) => {
    const onStop = (): void => {
      stopping = true;
      clearInterval(id);
      void (async () => {
        await tick();
        sqlite.close();
        await outboxWorker?.close();
        // eslint-disable-next-line no-console
        console.log("[worker] shutdown");
        resolve();
      })();
    };
    process.once("SIGINT", onStop);
    process.once("SIGTERM", onStop);
  });
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
