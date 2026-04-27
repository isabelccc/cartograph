/**
 * In-memory carrier for local dev / tests (no external API).
 */
import type { FulfillmentCarrierPort } from "./fulfillment.carrier.port.js";
import type {
  CarrierLabelReference,
  CarrierTrackingSnapshot,
  PurchaseLabelInput,
  PurchaseLabelResult,
} from "./fulfillment.types.js";

export function createStubFulfillmentCarrier(): FulfillmentCarrierPort {
  return {
    async purchaseLabel(input: PurchaseLabelInput): Promise<PurchaseLabelResult> {
      return {
        carrier: "stub",
        trackingNumber: `TRK-${input.fulfillmentId}`,
        trackingUrl: null,
        externalShipmentId: `ext-${input.fulfillmentId}`,
        labelUrl: null,
      };
    },

    async voidLabel(_ref: CarrierLabelReference): Promise<void> {},

    async getByTracking(
      trackingNumber: string,
      carrierCode?: string,
    ): Promise<CarrierTrackingSnapshot | null> {
      return {
        trackingNumber,
        carrier: carrierCode ?? "stub",
        statusSummary: "in_transit",
        deliveredAt: null,
      };
    },
  };
}
