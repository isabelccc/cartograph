import type { VariantId } from "../../domain-contracts/src/index.js";
import type {
  InventoryAdjustment,
  InventoryReservation,
  InventoryReservationId,
  StockLevel,
} from "./inventory.types.js";
/**
 * inventory — inventory.repository.port (port)
 *
 * Requirements:
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * TODO:

 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — inventory
 */
export interface InventoryRepositoryPort {
  loadStockByVariant(variantId: VariantId): Promise<StockLevel | null>;
  saveStockLevel(stockLevel: StockLevel): Promise<void>;
  createReservation(reservation: InventoryReservation): Promise<InventoryReservation>;
  loadReservationById(id: InventoryReservationId): Promise<InventoryReservation | null>;
  saveReservation(reservation: InventoryReservation): Promise<void>;
  findExpiredReservations(now: string): Promise<InventoryReservation[]>;
  recordAdjustments(adjustment: InventoryAdjustment): Promise<void>;
}

