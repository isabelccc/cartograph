/**
 * Contract-style checks: order state machine + outbox drain (no HTTP).
 */
import assert from "node:assert/strict";
import test from "node:test";

import { DomainError } from "../../packages/domain-contracts/src/errors.js";
import { openDrizzleSqlite } from "../../packages/persistence-drizzle/src/client.js";
import { drainOutbox, enqueueOutbox } from "../../packages/persistence-drizzle/src/outbox/drain.js";
import { transitionOrderState } from "../../packages/modules/order/order.state-machine.js";

test("order: placed → paid is allowed", () => {
  assert.equal(transitionOrderState("placed", "paid"), "paid");
});

test("order: placed → shipped is rejected", () => {
  assert.throws(
    () => transitionOrderState("placed", "shipped"),
    (e: unknown) => e instanceof DomainError && e.code === "ORDER_STATE_INVALID",
  );
});

test("outbox: enqueue then drain publishes rows", () => {
  const sqlite = openDrizzleSqlite(":memory:");
  try {
    enqueueOutbox(sqlite.db, "order.placed", "{}");
    assert.equal(drainOutbox(sqlite.db, 10), 1);
    assert.equal(drainOutbox(sqlite.db, 10), 0);
  } finally {
    sqlite.close();
  }
});
