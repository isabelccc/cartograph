/**
 * Returns eligibility (minimal): delivered orders only.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Workflows
 */
import type { OrderId } from "../../domain-contracts/src/index.js";
import type { OrderRepositoryPort } from "../../modules/order/order.repository.port.js";
import type { StepResult } from "./workflow.types.js";

export type ReturnWorkflowDeps = {
  readonly orderRepo: OrderRepositoryPort;
};

export async function runReturnWorkflow(deps: ReturnWorkflowDeps, orderId: OrderId): Promise<StepResult> {
  const order = await deps.orderRepo.getById(orderId);
  if (order === null) {
    return { ok: false, reason: "order_not_found" };
  }
  if (order.status !== "delivered") {
    return { ok: false, reason: "return_not_eligible" };
  }
  return { ok: true };
}
