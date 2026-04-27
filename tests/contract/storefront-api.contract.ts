/**
 * Stable path versioning for storefront/admin surfaces.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { API_VERSION, withApiVersion } from "../../apps/core-api/src/http/versioning.js";

test("storefront API path uses /store/v1", () => {
  assert.equal(API_VERSION, "v1");
  assert.equal(withApiVersion("/store"), "/store/v1");
});
