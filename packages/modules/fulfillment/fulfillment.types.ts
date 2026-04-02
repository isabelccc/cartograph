/**
 * fulfillment — fulfillment.types (types)
 *
 * Requirements:
 * - **Split shipments** — One order may produce several `Fulfillment` records; each carries a subset of lines (qty per variant).
 * - **R-DOM-1** — Types only here; persistence in `persistence-drizzle`.
 * - **R-DOM-3** — Model `status` transitions in the service (typed errors), not ad-hoc string writes.
 *
 * TODO:
 * - [ ] Link lines to `OrderLine` ids when order module defines snapshots.
 * - [ ] Carrier-specific metadata (label id, package dims) if `FulfillmentCarrierPort` needs it.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — fulfillment
 */
import type { FulfillmentId, VariantId } from "../../domain-contracts/src/index.js";
import type { OrderId } from "../order/order.types.js";

export type { FulfillmentId };

/** Lifecycle for a single shipment / fulfillment record. */
export type FulfillmentStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * One row in a shipment: which variant and how many units.
 * Avoid embedding full `Variant` — catalog data can change; fulfillment should stay a snapshot of ids + qty.
 */
export type FulfillmentLine = {
  readonly variantId: VariantId;
  readonly quantity: bigint;
};

export type Fulfillment = {
  readonly id: FulfillmentId;
  readonly orderId: OrderId;
  readonly lines: readonly FulfillmentLine[];
  readonly status: FulfillmentStatus;
  readonly carrier: string | null;
  readonly trackingNumber: string | null;
  readonly trackingUrl: string | null;
  readonly shippedAt: string | null;
  readonly deliveredAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/**
 * Latest tracking view from a carrier API — not your persisted {@link Fulfillment} row.
 * The service maps this onto repo state (status / deliveredAt).
 */
export type CarrierTrackingSnapshot = {
  readonly trackingNumber: string;
  readonly carrier: string;
  readonly statusSummary: string;
  readonly deliveredAt: string | null;
};

/** Address shape carriers expect (not your full customer profile). */
export type CarrierPostalAddress = {
  readonly name: string;
  readonly line1: string;
  readonly line2: string | null;
  readonly city: string;
  readonly region: string | null;
  readonly postalCode: string;
  readonly countryCode: string;
};

/** Buy postage + obtain label + tracking from the carrier API. */
export type PurchaseLabelInput = {
  readonly orderId: OrderId;
  readonly fulfillmentId: FulfillmentId;
  readonly shipFrom: CarrierPostalAddress;
  readonly shipTo: CarrierPostalAddress;
  /** Total parcel weight; line items alone are often not enough for rating. */
  readonly packageWeightGrams: number;
  /** Carrier-specific service (e.g. `UPS_GROUND`); `null` = adapter default. */
  readonly serviceCode: string | null;
};

export type PurchaseLabelResult = {
  readonly carrier: string;
  readonly trackingNumber: string;
  readonly trackingUrl: string | null;
  /** Carrier’s shipment/transaction id — keep for void/refund APIs. */
  readonly externalShipmentId: string;
  readonly labelUrl: string | null;
};

export type CarrierLabelReference = {
  readonly carrier: string;
  readonly externalShipmentId: string;
};
