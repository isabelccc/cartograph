/**
 * Test data builders (minimal stub).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Tests
 */
import { randomUUID } from "node:crypto";
import { toOrderId } from "../../domain-contracts/src/ids.js";

export function createTestOrderFactory() {
  return function createTestOrder() {
    return { id: toOrderId(`ord_test_${randomUUID()}`) };
  };
}
