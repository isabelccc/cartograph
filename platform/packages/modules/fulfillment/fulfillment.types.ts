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
