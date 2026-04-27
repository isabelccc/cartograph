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
  CarrierLabelReference,
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
  voidShippingLabel(ref: CarrierLabelReference): Promise<void>;
  getCarrierTrackingSnapshot(
    trackingNumber: string,
    carrierCode?: string,
  ): Promise<CarrierTrackingSnapshot | null>;
  syncFulfillmentFromCarrier(fulfillmentId: FulfillmentId): Promise<Fulfillment | null>;
}

export function createFulfillmentService(deps: FulfillmentServiceDeps): FulfillmentService {
  return {
    async getFulfillmentById(id: FulfillmentId): Promise<Fulfillment | null> {
      return deps.fulfillmentRepo.getById(id);
    },

    async listFulfillmentsByOrderId(orderId: OrderId): Promise<readonly Fulfillment[]> {
      return deps.fulfillmentRepo.listByOrderId(orderId);
    },

    async purchaseShippingLabel(input: PurchaseLabelInput): Promise<PurchaseLabelResult> {
      const label = await deps.fulfillmentCarrier.purchaseLabel(input);
      const fulfillment = await deps.fulfillmentRepo.getById(input.fulfillmentId);

      if (fulfillment !== null) {
        await deps.fulfillmentRepo.save({
          ...fulfillment,
          status: "processing",
          carrier: label.carrier,
          trackingNumber: label.trackingNumber,
          trackingUrl: label.trackingUrl,
          externalShipmentId: label.externalShipmentId,
          updatedAt: new Date().toISOString(),
        });
      }

      return label;
    },

    async voidShippingLabel(ref: CarrierLabelReference): Promise<void> {
      return deps.fulfillmentCarrier.voidLabel(ref);
    },

    async getCarrierTrackingSnapshot(
      trackingNumber: string,
      carrierCode?: string,
    ): Promise<CarrierTrackingSnapshot | null> {
      return deps.fulfillmentCarrier.getByTracking(trackingNumber, carrierCode);
    },

    async syncFulfillmentFromCarrier(fulfillmentId: FulfillmentId): Promise<Fulfillment | null> {
      const fulfillment = await deps.fulfillmentRepo.getById(fulfillmentId);

      if (fulfillment === null) {
        return null;
      }

      if (fulfillment.trackingNumber === null) {
        return fulfillment;
      }

      const snapshot = await deps.fulfillmentCarrier.getByTracking(
        fulfillment.trackingNumber,
        fulfillment.carrier ?? undefined,
      );

      if (snapshot === null) {
        return fulfillment;
      }

      const updated: Fulfillment = {
        ...fulfillment,
        status: snapshot.deliveredAt === null ? fulfillment.status : "delivered",
        deliveredAt: snapshot.deliveredAt ?? fulfillment.deliveredAt,
        updatedAt: new Date().toISOString(),
      };

      await deps.fulfillmentRepo.save(updated);
      return updated;
    },
  };
}
