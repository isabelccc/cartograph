/**
 * inventory — inventory.types (types)
 *
 * Requirements:
 * - ATP, reservation
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * TODO:
 * - [ ] Stock levels
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — inventory
 */

import type { VariantId, OrderId} from "../../domain-contracts/src/index.js"
export type Sku = string;
export type InventoryReservationId = string & {
    readonly __brand: "InventoryReservationId";
  };

export type InventoryReservationStatus = | "active" | "committed"|"released"| "expired"

export type StockLevel = {
    readonly variantId:VariantId;
    readonly sku: Sku;
    readonly onHand:bigint;
    readonly reserved:bigint;
    readonly availableToPromise:bigint;
    readonly updatedAt:string;
}

export type InventoryReservationLine = {
    readonly variantId:VariantId;
    readonly quantity:bigint;

}

export type InventoryReservation = {
    readonly id:InventoryReservationId;
    readonly orderId:OrderId | null;
    readonly lines : readonly InventoryReservationLine[];
    readonly status: InventoryReservationStatus;
    readonly expiresAt: string;
    readonly createdAt: string;
    readonly updatedAt: string;
};

export type InventoryAdjustmentReason =
  | "manual"
  | "receiving"
  | "correction"
  | "damage"
  | "return";



  export type InventoryAdjustment = {
    readonly variantId: VariantId;
    readonly quantityDelta: bigint;
    readonly reason: InventoryAdjustmentReason;
  };

