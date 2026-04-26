import type { TimestampFsp } from "drizzle-orm/mysql-core";
import type { VariantId } from "../cart/cart.types.js";
import type { StockLevel, InventoryReservation,InventoryReservationId } from "./inventory.types.js";
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
    loadStockByVariant(variantId: VariantId):Promise<StockLevel|null>;
    saveStockLevel(stockLevel:StockLevel):Promise<void>;
    createReservation(reservation:InventoryReservation):Promise<InventoryReservation>;
    loadReservationById(id:InventoryReservationId):Promise<InventoryReservation>;
    saveReservation(reservation:InventoryReservation):Promise<void>;
    findExpiredReservation(now:TimestampFsp):Promise<InventoryReservation[]>;
    recordAdjustments():Promise<void>;

}

