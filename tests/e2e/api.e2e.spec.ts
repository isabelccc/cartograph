import { test, expect } from "@playwright/test";

test.describe("core-api (HTTP E2E)", () => {
  test("GET /ready returns 200 with ok body", async ({ request }) => {
    const res = await request.get("/ready");
    const text = await res.text();
    expect(res.status(), text).toBe(200);
    const json = JSON.parse(text) as { ok?: boolean };
    expect(json.ok).toBe(true);
  });

  test("GET /store/v1/health is OK", async ({ request }) => {
    const res = await request.get("/store/v1/health");
    expect(res.status()).toBe(200);
  });

  test("GET /store/v1/catalog/products lists seeded MVP product", async ({ request }) => {
    const res = await request.get("/store/v1/catalog/products?activeOnly=true");
    const text = await res.text();
    expect(res.status(), text).toBe(200);
    expect(text).toContain("prod_mvp_demo");
    expect(text).toContain("MVP Demo Product");
  });

  test("POST /store/v1/orders requires Idempotency-Key", async ({ request }) => {
    const cart = await request.post("/store/v1/carts", {
      data: { currency: "USD" },
    });
    expect(cart.status()).toBe(201);
    const { id: cartId } = (await cart.json()) as { id: string };
    const line = await request.post(`/store/v1/carts/${cartId}/lines`, {
      data: {
        productId: "prod_mvp_demo",
        variantId: "var_mvp_demo",
        quantity: "1",
      },
    });
    expect(line.status(), await line.text()).toBe(201);
    const res = await request.post("/store/v1/orders", {
      data: { cartId },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /store/v1/orders replays same response for same Idempotency-Key", async ({
    request,
  }) => {
    const cart = await request.post("/store/v1/carts", {
      data: { currency: "USD" },
    });
    const { id: cartId } = (await cart.json()) as { id: string };
    const lineRes = await request.post(`/store/v1/carts/${cartId}/lines`, {
      data: {
        productId: "prod_mvp_demo",
        variantId: "var_mvp_demo",
        quantity: "1",
      },
    });
    expect(lineRes.status(), await lineRes.text()).toBe(201);
    const key = `idem-orders-${Date.now()}`;
    const r1 = await request.post("/store/v1/orders", {
      headers: { "Idempotency-Key": key },
      data: { cartId },
    });
    const r2 = await request.post("/store/v1/orders", {
      headers: { "Idempotency-Key": key },
      data: { cartId },
    });
    expect(r1.status()).toBe(201);
    expect(r2.status()).toBe(201);
    expect(await r2.text()).toBe(await r1.text());
  });

  test("POST /store/v1/checkout creates order with inventory reservation", async ({
    request,
  }) => {
    const cart = await request.post("/store/v1/carts", {
      data: { currency: "USD" },
    });
    const { id: cartId } = (await cart.json()) as { id: string };
    const lineRes = await request.post(`/store/v1/carts/${cartId}/lines`, {
      data: {
        productId: "prod_mvp_demo",
        variantId: "var_mvp_demo",
        quantity: "1",
      },
    });
    expect(lineRes.status(), await lineRes.text()).toBe(201);
    const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
    const res = await request.post("/store/v1/checkout", {
      headers: { "Idempotency-Key": `checkout-${Date.now()}` },
      data: {
        cartId,
        reservation: {
          lines: [{ variantId: "var_mvp_demo", quantity: "1" }],
          expiresAt,
        },
      },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = (await res.json()) as { orderId?: string; reservationId?: string };
    expect(body.orderId).toBeTruthy();
    expect(body.reservationId).toBeTruthy();
  });
});
