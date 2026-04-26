import type { InventoryRepositoryPort } from "./inventory.repository.port.js";

/**
 * inventory — inventory.service (service)
 *
 * Requirements:
 * - Reservation TTL; negative stock guard
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * TODO:
 * - [ ] reserve, release, adjust
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — inventory
 */

export type InventoryServiceDeps = {
  readonly inventoryRepo: InventoryRepositoryPort;
  
};
export function createInventoryService(): InventoryServiceDeps {
  throw new Error("TODO: createInventoryService — see file header JSDoc");
}



/** Public API produced by `createFulfillmentService` (implementations live in the factory body). */
export interface InventoryService {
  loadStockByVariant(variantId: VariantId):Promise<StockLevel|null>;
  saveStockLevel(stockLevel:StockLevel):Promise<void>;
  createReservation(reservation:InventoryReservation):Promise<InventoryReservation>;
  loadReservationById(id:InventoryReservationId):Promise<InventoryReservation>;
  saveReservation(reservation:InventoryReservation):Promise<void>;
  findExpiredReservation(now:TimestampFsp):Promise<InventoryReservation[]>;
  recordAdjustments():Promise<void>;
}

