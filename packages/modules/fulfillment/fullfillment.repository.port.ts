
import type { OrderId } from "../order/order.types.js";
import type { Fulfillment, FulfillmentId } from "./fulfillment.types.js";

export interface FulfillmentRepoPort {
    getById(id: FulfillmentId): Promise<Fulfillment | null>;
    listByOrderId(id:OrderId):Promise<Fulfillment[]|null>;
    
  }