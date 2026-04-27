/**
 * Send fulfillment-related events to shipping provider webhooks.
 */
export async function runLogisticsSyncTick(opts: {
  readonly shippingApiKey?: string;
  readonly topic: string;
  readonly payload: string;
}): Promise<number> {
  if (opts.shippingApiKey === undefined) {
    return 0;
  }
  if (!opts.topic.startsWith("fulfillment.")) {
    return 0;
  }
  const endpoint = process.env.SHIPPING_WEBHOOK_URL?.trim();
  if (endpoint === undefined || endpoint.length === 0) {
    return 0;
  }
  await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${opts.shippingApiKey}`,
    },
    body: opts.payload,
  });
  return 1;
}
