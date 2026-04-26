/**
 * fulfillment — fulfillment.service (service)
 *
 * Requirements:
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * TODO:
 * - [ ] Implement `createFulfillmentService` against `FulfillmentService`.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — fulfillment
 */
import type { FulfillmentCarrierPort } from "./fulfillment.carrier.port.js";
import type { FulfillmentRepoPort } from "./fulfillment.repository.port.js";
import type {
  CarrierTrackingSnapshot,
  Fulfillment,
  FulfillmentId,
  PurchaseLabelInput,
  PurchaseLabelResult,
} from "./fulfillment.types.js";
import type { OrderId } from "../order/order.types.js";

export type FulfillmentServiceDeps = {
  readonly fulfillmentRepo: FulfillmentRepoPort;
  readonly fulfillmentCarrier: FulfillmentCarrierPort;
};

/** Public API produced by `createFulfillmentService` (implementations live in the factory body). */
export interface FulfillmentService {
  getFulfillmentById(id: FulfillmentId): Promise<Fulfillment | null>;
  listFulfillmentsByOrderId(orderId: OrderId): Promise<readonly Fulfillment[]>;
  purchaseShippingLabel(input: PurchaseLabelInput): Promise<PurchaseLabelResult>;
  voidShippingLabel(fulfillmentId: FulfillmentId): Promise<void>;
  getCarrierTrackingSnapshot(
    trackingNumber: string,
    carrierCode?: string,
  ): Promise<CarrierTrackingSnapshot | null>;
  syncFulfillmentFromCarrier(fulfillmentId: FulfillmentId): Promise<Fulfillment | null>;
}

export function createFulfillmentService(_deps: FulfillmentServiceDeps) {
  
  return {
    async getFulfillmentById(id: FulfillmentId): Promise<Fulfillment | null>{
    return _deps.fulfillmentRepo.getById(id);
    },
    async listFulfillmentsByOrderId(orderId:OrderId):Promise<readonly Fulfillment[]>{
        return _deps.fulfillmentRepo.listByOrderId(orderId);

    },
    async purchaseShippingLabel(input: PurchaseLabelInput):Promise<PurchaseLabelResult>{
      return _deps.fulfillmentCarrier.purchaseLabel(input);
    },
    async voidShippingLabel(fulfillmentId:FulfillmentId)

  }
}
