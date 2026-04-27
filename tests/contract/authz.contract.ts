/**
 * Coarse RBAC matrix (admin / shop / anonymous).
 */
import assert from "node:assert/strict";
import test from "node:test";

import { authorize } from "../../packages/authz/src/authorize.js";
import { Actions } from "../../packages/authz/src/policies.js";

test("admin may write admin resources", () => {
  assert.equal(authorize("admin", Actions.ADMIN_WRITE), true);
});

test("anonymous may not admin write", () => {
  assert.equal(authorize("anonymous", Actions.ADMIN_WRITE), false);
});

test("shop may shop write", () => {
  assert.equal(authorize("shop", Actions.SHOP_WRITE), true);
});
