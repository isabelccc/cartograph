/**
 * HTTP smoke tests against a running core-api.
 *
 * Shallow (default):
 *   GET /ready, GET /store/v1/health, GET /store/v1/catalog/products
 *
 * Environment:
 *   SMOKE_BASE_URL       — default http://127.0.0.1:3000
 *   SMOKE_SHOP_KEY       — X-Shop-Key when the server has SHOP_API_KEY set
 *   SMOKE_TENANT_ID      — X-Tenant-Id on all requests (needed if server uses DEFAULT_TENANT_ID flows)
 *   SMOKE_STRICT_SEED=1  — require MVP demo SKU in catalog JSON
 *   SMOKE_DEEP=1         — cart → line → POST /store/v1/checkout (mutates data)
 *   SMOKE_ADMIN_KEY      — if set with SMOKE_TENANT_ID, GET /admin/v1/status
 *
 * Examples:
 *   npm run smoke
 *   SMOKE_BASE_URL=http://127.0.0.1:3310 SMOKE_DEEP=1 SMOKE_STRICT_SEED=1 npm run smoke
 *   SMOKE_ADMIN_KEY=secret SMOKE_TENANT_ID=tenant_demo npm run smoke
 */
const base = (process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const storeV1 = `${base}/store/v1`;
const adminV1 = `${base}/admin/v1`;

const strictSeed = truthy(process.env.SMOKE_STRICT_SEED);
const deep = truthy(process.env.SMOKE_DEEP);
const adminKey = process.env.SMOKE_ADMIN_KEY?.trim();
const tenantId = process.env.SMOKE_TENANT_ID?.trim();
const shopKey = process.env.SMOKE_SHOP_KEY?.trim();

function truthy(v: string | undefined): boolean {
  if (v === undefined) return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function commonHeaders(): Record<string, string> {
  return {
    Accept: "application/json",
    ...(shopKey ? { "X-Shop-Key": shopKey } : {}),
    ...(tenantId ? { "X-Tenant-Id": tenantId } : {}),
  };
}

async function get(path: string, headers?: Record<string, string>): Promise<Response> {
  return fetch(path, { headers: { ...commonHeaders(), ...headers } });
}

async function postJson(path: string, body: unknown, headers?: Record<string, string>): Promise<Response> {
  return fetch(path, {
    method: "POST",
    headers: {
      ...commonHeaders(),
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function fail(step: string, res: Response, body: string): never {
  throw new Error(`${step}: expected success, got HTTP ${res.status}: ${body.slice(0, 500)}`);
}

async function main(): Promise<void> {
  // --- Readiness & store surface
  const ready = await get(`${base}/ready`);
  const readyText = await ready.text();
  if (ready.status !== 200) {
    fail("GET /ready", ready, readyText);
  }
  const readyJson = JSON.parse(readyText) as { ok?: boolean };
  if (readyJson.ok !== true) {
    throw new Error(`GET /ready: body ok !== true: ${readyText}`);
  }

  const storeHealth = await get(`${storeV1}/health`);
  const storeHealthText = await storeHealth.text();
  if (storeHealth.status !== 200) {
    fail("GET /store/v1/health", storeHealth, storeHealthText);
  }
  const storeHealthJson = JSON.parse(storeHealthText) as { ok?: boolean };
  if (storeHealthJson.ok !== true) {
    throw new Error(`GET /store/v1/health: expected ok true: ${storeHealthText}`);
  }

  const products = await get(`${storeV1}/catalog/products?activeOnly=true`);
  const productsText = await products.text();
  if (products.status !== 200) {
    fail("GET /store/v1/catalog/products", products, productsText);
  }
  if (strictSeed) {
    if (!productsText.includes("prod_mvp_demo") || !productsText.includes("MVP Demo Product")) {
      throw new Error(
        "SMOKE_STRICT_SEED: catalog response missing MVP demo product; run `npm run db:seed` on this database.",
      );
    }
  }

  // --- Optional protected admin ping
  if (adminKey !== undefined && adminKey.length > 0) {
    if (tenantId === undefined || tenantId.length === 0) {
      throw new Error("SMOKE_ADMIN_KEY requires SMOKE_TENANT_ID (admin actions are tenant-scoped).");
    }
    const adminStatus = await get(`${adminV1}/status`, {
      "X-Admin-Key": adminKey,
    });
    const adminText = await adminStatus.text();
    if (adminStatus.status !== 200) {
      fail("GET /admin/v1/status", adminStatus, adminText);
    }
    const adminJson = JSON.parse(adminText) as { ok?: boolean; protected?: boolean };
    if (adminJson.ok !== true || adminJson.protected !== true) {
      throw new Error(`GET /admin/v1/status: unexpected body: ${adminText}`);
    }
  }

  // --- Deep: checkout path (OIDC + shop key + tenant must match server config)
  if (deep) {
    const idem = `smoke-${Date.now()}`;
    const cartRes = await postJson(
      `${storeV1}/carts`,
      { currency: "USD" },
      { "Idempotency-Key": `${idem}-cart` },
    );
    const cartText = await cartRes.text();
    if (cartRes.status !== 201) {
      fail("POST /store/v1/carts", cartRes, cartText);
    }
    const { id: cartId } = JSON.parse(cartText) as { id: string };

    const lineRes = await postJson(
      `${storeV1}/carts/${cartId}/lines`,
      {
        productId: "prod_mvp_demo",
        variantId: "var_mvp_demo",
        quantity: "1",
      },
      { "Idempotency-Key": `${idem}-line` },
    );
    const lineText = await lineRes.text();
    if (lineRes.status !== 201) {
      fail("POST /store/v1/carts/.../lines", lineRes, lineText);
    }

    const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
    const checkoutRes = await postJson(
      `${storeV1}/checkout`,
      {
        cartId,
        reservation: {
          lines: [{ variantId: "var_mvp_demo", quantity: "1" }],
          expiresAt,
        },
      },
      { "Idempotency-Key": `${idem}-checkout` },
    );
    const checkoutText = await checkoutRes.text();
    if (checkoutRes.status !== 200) {
      fail("POST /store/v1/checkout", checkoutRes, checkoutText);
    }
    const checkoutJson = JSON.parse(checkoutText) as { orderId?: string; reservationId?: string };
    if (!checkoutJson.orderId || !checkoutJson.reservationId) {
      throw new Error(`POST /store/v1/checkout: missing ids: ${checkoutText}`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      ok: true,
      base,
      checks: {
        ready: true,
        storeHealth: true,
        catalog: true,
        strictSeed,
        deep,
        admin: Boolean(adminKey),
      },
    }),
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
