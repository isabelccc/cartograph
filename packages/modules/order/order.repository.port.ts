/**
 * order — order.repository.port (port)
 */
import type { CustomerId } from "../../domain-contracts/src/index.js";
import type { Order, OrderId } from "./order.types.js";

export interface OrderRepositoryPort {
  getById(id: OrderId): Promise<Order | null>;
  save(order: Order): Promise<void>;
  listByCustomerId(customerId: CustomerId): Promise<readonly Order[]>;
}
