/**
 * order — order.state-machine (state machine)
 */
import { DomainError } from "../../domain-contracts/src/errors.js";
import type { OrderStatus } from "./order.types.js";

const allowed: Record<OrderStatus, readonly OrderStatus[]> = {
  placed: ["cancelled"],
  cancelled: [],
};

export function transitionOrderState(from: OrderStatus, to: OrderStatus): OrderStatus {
  if (from === to) return to;
  if (!allowed[from].includes(to)) {
    throw new DomainError(
      "ORDER_STATE_INVALID",
      `Cannot transition order state from ${from} to ${to}`,
    );
  }
  return to;
}
