import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";

export const OUTBOX_QUEUE = "outbox-events";

export function createRedisConnection(redisUrl: string): Redis {
  return new Redis(redisUrl, { maxRetriesPerRequest: null });
}

export function createOutboxQueue(redisUrl: string): Queue {
  return new Queue(OUTBOX_QUEUE, {
    connection: createRedisConnection(redisUrl),
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "exponential", delay: 500 },
      removeOnComplete: 1000,
      removeOnFail: 2000,
    },
  });
}

export function createOutboxWorker(
  redisUrl: string,
  handler: (topic: string, payload: string) => Promise<void>,
): Worker {
  return new Worker(
    OUTBOX_QUEUE,
    async (job) => {
      const topic = String(job.data?.topic ?? "");
      const payload = String(job.data?.payload ?? "{}");
      await handler(topic, payload);
    },
    {
      connection: createRedisConnection(redisUrl),
    },
  );
}
