import type {
  CarrierLabelReference,
  CarrierTrackingSnapshot,
  PurchaseLabelInput,
  PurchaseLabelResult,
} from "./fulfillment.types.js";

/**
 * fulfillment — fulfillment.carrier.port (port)
 *
 * Requirements:
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * Checkout **rate quotes** are often a separate port (many apps quote before `Fulfillment` exists).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — fulfillment
 */
export interface FulfillmentCarrierPort {
  purchaseLabel(input: PurchaseLabelInput): Promise<PurchaseLabelResult>;
  /** Void/refund a label within the carrier’s allowed window, if supported. */
  voidLabel(ref: CarrierLabelReference): Promise<void>;
  /** Poll tracking; pass `carrierCode` when the same tracking format is ambiguous. */
  getByTracking(trackingNumber: string, carrierCode?: string): Promise<CarrierTrackingSnapshot | null>;
}
