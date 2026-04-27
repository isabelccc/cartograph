import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createOutboxQueue, createOutboxWorker } from "../../packages/events/src/queue.js";

test("bullmq queue roundtrip works when REDIS_URL configured", async (t) => {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl === undefined || redisUrl.length === 0) {
    t.diagnostic("REDIS_URL not configured; skipping queue integration test.");
    return;
  }
  const seen: string[] = [];
  const worker = createOutboxWorker(redisUrl, async (topic, payload) => {
    seen.push(`${topic}:${payload}`);
  });
  const queue = createOutboxQueue(redisUrl);
  const topic = `test.topic.${randomUUID()}`;
  const payload = JSON.stringify({ hello: "world" });
  await queue.add(topic, { topic, payload });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("queue message not processed in time")), 10_000);
    const id = setInterval(() => {
      if (seen.length > 0) {
        clearInterval(id);
        clearTimeout(timeout);
        resolve();
      }
    }, 100);
  });
  assert.ok(seen[0]?.includes(topic));
  await queue.close();
  await worker.close();
});
