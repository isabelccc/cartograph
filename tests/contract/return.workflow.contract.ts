/**
 * Return eligibility workflow.
 */
import assert from "node:assert/strict";
import test from "node:test";

import type { OrderId } from "../../packages/domain-contracts/src/index.js";
import { toOrderId } from "../../packages/domain-contracts/src/ids.js";
import type { OrderRepositoryPort } from "../../packages/modules/order/order.repository.port.js";
import type { Order } from "../../packages/modules/order/order.types.js";
import { runReturnWorkflow } from "../../packages/workflows/src/return.workflow.js";

test("return: delivered order is eligible", async () => {
  const orderId = toOrderId("ord_test_1");
  const order: Order = {
    id: orderId,
    status: "delivered",
    currency: "USD",
    subtotal: { amountMinor: 100n, currency: "USD" },
    total: { amountMinor: 100n, currency: "USD" },
    lines: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const orderRepo: OrderRepositoryPort = {
    async getById(id: OrderId) {
      return id === orderId ? order : null;
    },
    async save() {},
    async listByCustomerId() {
      return [];
    },
  };
  const r = await runReturnWorkflow({ orderRepo }, orderId);
  assert.deepEqual(r, { ok: true });
});

test("return: placed order is not eligible", async () => {
  const orderId = toOrderId("ord_test_2");
  const order: Order = {
    id: orderId,
    status: "placed",
    currency: "USD",
    subtotal: { amountMinor: 100n, currency: "USD" },
    total: { amountMinor: 100n, currency: "USD" },
    lines: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const orderRepo: OrderRepositoryPort = {
    async getById() {
      return order;
    },
    async save() {},
    async listByCustomerId() {
      return [];
    },
  };
  const r = await runReturnWorkflow({ orderRepo }, orderId);
  assert.equal(r.ok, false);
});
