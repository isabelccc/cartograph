/**
 * Search index fan-out. Wire Meilisearch / ES when the plugin publishes index jobs.
 */
import { Meilisearch } from "meilisearch";

export async function runSearchIndexTick(opts?: {
  readonly meiliUrl?: string;
  readonly meiliKey?: string;
  readonly topic?: string;
  readonly payload?: string;
}): Promise<number> {
  if (opts?.meiliUrl === undefined || opts.topic === undefined || opts.payload === undefined) {
    return 0;
  }
  const client = new Meilisearch({
    host: opts.meiliUrl,
    apiKey: opts.meiliKey,
  });
  const indexName = "domain-events";
  const index = client.index(indexName);
  await index.addDocuments([
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      topic: opts.topic,
      payload: opts.payload,
      createdAt: new Date().toISOString(),
    },
  ]);
  return 1;
}
