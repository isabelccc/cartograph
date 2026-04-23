import type { OrderId } from "../order/order.types.js";
import type { Fulfillment, FulfillmentId } from "./fulfillment.types.js";

export interface FulfillmentRepoPort {
  getById(id: FulfillmentId): Promise<Fulfillment | null>;
  listByOrderId(orderId: OrderId): Promise<readonly Fulfillment[]>;
  save(fulfillment: Fulfillment): Promise<void>;
}
