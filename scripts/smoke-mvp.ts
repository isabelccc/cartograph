/**
 * HTTP smoke: /ready + catalog list. Requires a running core-api.
 *   SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke
 */
const base = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const v1 = `${base}/store/v1`;
const key = process.env.SMOKE_SHOP_KEY;
const commonHeaders: Record<string, string> = {
  Accept: "application/json",
  ...(key ? { "X-Shop-Key": key } : {}),
};

async function get(path: string): Promise<{ status: number; body: string }> {
  const r = await fetch(path, { headers: commonHeaders });
  const body = await r.text();
  return { status: r.status, body };
}

async function main(): Promise<void> {
  const ready = await get(`${base}/ready`);
  if (ready.status !== 200) {
    throw new Error(`GET /ready expected 200, got ${ready.status}: ${ready.body}`);
  }
  const products = await get(`${v1}/catalog/products?activeOnly=true`);
  if (products.status !== 200) {
    throw new Error(`GET catalog expected 200, got ${products.status}: ${products.body}`);
  }
  // eslint-disable-next-line no-console
  console.log("smoke: ok", { base, catalogSample: products.body.slice(0, 200) });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
