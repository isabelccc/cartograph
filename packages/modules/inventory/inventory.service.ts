import { randomUUID } from "node:crypto";
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

import type { VariantId } from "../catalog/variant.types.js";
import type {
  InventoryAdjustment,
  InventoryReservation,
  InventoryReservationId,
  StockLevel,
} from "./inventory.types.js";
import { DomainError } from "../../domain-contracts/src/errors.js";
export type InventoryServiceDeps = {
  readonly inventoryRepo: InventoryRepositoryPort;
};



export type ReserveInventoryInput = {
  readonly orderId: InventoryReservation["orderId"];
  readonly lines: InventoryReservation["lines"];
  readonly expiresAt: string;
};

/** Public API produced by `createInventoryService` (implementations live in the factory body). */
export interface InventoryService {
  getAvailableToPromise(variantId: VariantId): Promise<bigint>;
  reserve(input: ReserveInventoryInput): Promise<InventoryReservation>;
  releaseReservation(id: InventoryReservationId): Promise<InventoryReservation>;
  commitReservation(id: InventoryReservationId): Promise<InventoryReservation>;
  adjustStock(adjustment: InventoryAdjustment): Promise<StockLevel>;
  expireReservations(now: string): Promise<readonly InventoryReservation[]>;
}

export function createInventoryService(deps: InventoryServiceDeps): InventoryService {
  async function loadStockOrThrow(variantId: VariantId): Promise<StockLevel> {
    const stock = await deps.inventoryRepo.loadStockByVariant(variantId);
    if (stock === null) {
      throw new DomainError("INVENTORY_NOT_FOUND", "inventory stock level not found");
    }
    return stock;
  }

  function assertPositiveQuantity(quantity: bigint): void {
    if (quantity <= 0n) {
      throw new DomainError("INVENTORY_QUANTITY_INVALID", "inventory quantity must be positive");
    }
  }

  async function releaseReservedStock(
    reservation: InventoryReservation,
    status: "released" | "expired",
    now: string,
  ): Promise<InventoryReservation> {
    for (const line of reservation.lines) {
      assertPositiveQuantity(line.quantity);
      const stock = await loadStockOrThrow(line.variantId);
      if (stock.reserved < line.quantity) {
        throw new DomainError("INVENTORY_RESERVED_UNDERFLOW", "reserved inventory cannot go negative");
      }

      await deps.inventoryRepo.saveStockLevel({
        ...stock,
        reserved: stock.reserved - line.quantity,
        availableToPromise: stock.availableToPromise + line.quantity,
        updatedAt: now,
      });
    }

    const updated: InventoryReservation = {
      ...reservation,
      status,
      updatedAt: now,
    };

    await deps.inventoryRepo.saveReservation(updated);
    return updated;
  }

  return {
    async getAvailableToPromise(variantId: VariantId): Promise<bigint> {
      const stockLevel = await deps.inventoryRepo.loadStockByVariant(variantId);
      return stockLevel?.availableToPromise ?? 0n;
    },

    async reserve(input: ReserveInventoryInput): Promise<InventoryReservation> {
      const now = new Date().toISOString();

      for (const line of input.lines) {
        assertPositiveQuantity(line.quantity);
        const stockLevel = await loadStockOrThrow(line.variantId);
        if (stockLevel.availableToPromise < line.quantity) {
          throw new DomainError("INVENTORY_INSUFFICIENT_STOCK", "insufficient inventory");
        }

        await deps.inventoryRepo.saveStockLevel({
          ...stockLevel,
          reserved: stockLevel.reserved + line.quantity,
          availableToPromise: stockLevel.availableToPromise - line.quantity,
          updatedAt: now,
        });
      }

      const reservation: InventoryReservation = {
        id: randomUUID() as InventoryReservationId,
        orderId: input.orderId,
        lines: input.lines,
        status: "active",
        expiresAt: input.expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      return deps.inventoryRepo.createReservation(reservation);
    },

    async releaseReservation(id: InventoryReservationId): Promise<InventoryReservation> {
      const reservation = await deps.inventoryRepo.loadReservationById(id);
      if (reservation === null) {
        throw new DomainError("INVENTORY_RESERVATION_NOT_FOUND", "inventory reservation not found");
      }
      if (reservation.status !== "active") {
        throw new DomainError("INVENTORY_RESERVATION_NOT_ACTIVE", "inventory reservation not active");
      }

      return releaseReservedStock(reservation, "released", new Date().toISOString());
    },

    async commitReservation(id: InventoryReservationId): Promise<InventoryReservation> {
      const reservation = await deps.inventoryRepo.loadReservationById(id);
      if (reservation === null) {
        throw new DomainError("INVENTORY_RESERVATION_NOT_FOUND", "inventory reservation not found");
      }
      if (reservation.status !== "active") {
        throw new DomainError("INVENTORY_RESERVATION_NOT_ACTIVE", "inventory reservation not active");
      }

      const now = new Date().toISOString();
      for (const line of reservation.lines) {
        assertPositiveQuantity(line.quantity);
        const stock = await loadStockOrThrow(line.variantId);
        if (stock.reserved < line.quantity) {
          throw new DomainError("INVENTORY_RESERVED_UNDERFLOW", "reserved inventory cannot go negative");
        }
        if (stock.onHand < line.quantity) {
          throw new DomainError("INVENTORY_NEGATIVE_STOCK", "stock on hand cannot go negative");
        }

        await deps.inventoryRepo.saveStockLevel({
          ...stock,
          onHand: stock.onHand - line.quantity,
          reserved: stock.reserved - line.quantity,
          updatedAt: now,
        });
      }

      const committed: InventoryReservation = {
        ...reservation,
        status: "committed",
        updatedAt: now,
      };

      await deps.inventoryRepo.saveReservation(committed);
      return committed;
    },

    async adjustStock(adjustment: InventoryAdjustment): Promise<StockLevel> {
      if (adjustment.quantityDelta === 0n) {
        throw new DomainError("INVENTORY_ADJUSTMENT_INVALID", "inventory adjustment cannot be zero");
      }

      const stock = await loadStockOrThrow(adjustment.variantId);
      const onHand = stock.onHand + adjustment.quantityDelta;
      const availableToPromise = stock.availableToPromise + adjustment.quantityDelta;

      if (onHand < 0n || availableToPromise < 0n) {
        throw new DomainError("INVENTORY_NEGATIVE_STOCK", "inventory adjustment cannot create negative stock");
      }

      const updated: StockLevel = {
        ...stock,
        onHand,
        availableToPromise,
        updatedAt: new Date().toISOString(),
      };

      await deps.inventoryRepo.saveStockLevel(updated);
      await deps.inventoryRepo.recordAdjustments(adjustment);
      return updated;
    },

    async expireReservations(now: string): Promise<readonly InventoryReservation[]> {
      const reservations = await deps.inventoryRepo.findExpiredReservations(now);
      const expired: InventoryReservation[] = [];

      for (const reservation of reservations) {
        if (reservation.status === "active") {
          expired.push(await releaseReservedStock(reservation, "expired", now));
        }
      }

      return expired;
    },
  };
}

