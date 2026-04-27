/**
 * Cost-estimation intake: review-queue status is stable for admin list filters.
 */
import assert from "node:assert/strict";
import test from "node:test";

import type { ProductIntakeStatus } from "../../packages/modules/cost-estimation/cost-estimation.types.js";

test("needs_review is a valid ProductIntakeStatus", () => {
  const status = "needs_review";
  const _: ProductIntakeStatus = status;
  assert.equal(_, "needs_review");
});
