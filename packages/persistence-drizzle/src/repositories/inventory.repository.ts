import { randomUUID } from "node:crypto";
import { and, eq, lte } from "drizzle-orm";
import { toOrderId, toVariantId, type VariantId } from "../../../domain-contracts/src/ids.js";
import type {
  InventoryAdjustment,
  InventoryReservation,
  InventoryReservationId,
  StockLevel,
} from "../../../modules/inventory/inventory.types.js";
import type { InventoryRepositoryPort } from "../../../modules/inventory/inventory.repository.port.js";
import type { AppDb } from "../client.js";
import { inventory_adjustments, inventory_reservations, inventory_stock_levels } from "../schema/index.js";

/**
 * Drizzle repository implementing inventory port from packages/modules.
 *
 * Requirements:
 * - R-DOM-1: No domain rules in SQL layer; map rows ↔ domain types.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Persistence
 */
function rowToStockLevel(head: {
  variantId: string;
  sku: string;
  onHand: string;
  reserved: string;
  availableToPromise: string;
  updatedAt: string;
}): StockLevel {
  return {
    variantId: toVariantId(head.variantId),
    sku: head.sku,
    onHand: BigInt(head.onHand),
    reserved: BigInt(head.reserved),
    availableToPromise: BigInt(head.availableToPromise),
    updatedAt: head.updatedAt,
  };
}

function serializeReservationLines(lines: InventoryReservation["lines"]): string {
  return JSON.stringify(
    lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity.toString(),
    })),
  );
}

function rowToReservation(row: {
  id: string;
  order_id: string | null;
  lines: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}): InventoryReservation {
  const lines = JSON.parse(row.lines) as { variantId: string; quantity: string }[];

  return {
    id: row.id as InventoryReservationId,
    orderId: row.order_id === null ? null : toOrderId(row.order_id),
    lines: lines.map((line) => ({
      variantId: toVariantId(line.variantId),
      quantity: BigInt(line.quantity),
    })),
    status: row.status as InventoryReservation["status"],
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function reservationValues(reservation: InventoryReservation) {
  return {
    id: reservation.id,
    order_id: reservation.orderId,
    lines: serializeReservationLines(reservation.lines),
    status: reservation.status,
    expiresAt: reservation.expiresAt,
    createdAt: reservation.createdAt,
    updatedAt: reservation.updatedAt,
  };
}

export function createInventoryRepository(db: AppDb): InventoryRepositoryPort {
  return {
    async loadStockByVariant(variantId: VariantId): Promise<StockLevel | null> {
      const [head] = await db
        .select()
        .from(inventory_stock_levels)
        .where(eq(inventory_stock_levels.variantId, variantId))
        .limit(1);

      if (head === undefined) return null;
      return rowToStockLevel(head);
    },

    async saveStockLevel(stockLevel: StockLevel): Promise<void> {
      await db.transaction(async (tx) => {
        await tx
          .insert(inventory_stock_levels)
          .values({
            variantId: stockLevel.variantId,
            sku: stockLevel.sku,
            onHand: stockLevel.onHand.toString(),
            reserved: stockLevel.reserved.toString(),
            availableToPromise: stockLevel.availableToPromise.toString(),
            updatedAt: stockLevel.updatedAt,
          })
          .onConflictDoUpdate({
            target: inventory_stock_levels.variantId,
            set: {
              sku: stockLevel.sku,
              onHand: stockLevel.onHand.toString(),
              reserved: stockLevel.reserved.toString(),
              availableToPromise: stockLevel.availableToPromise.toString(),
              updatedAt: stockLevel.updatedAt,
            },
          });
      });
    },

    async createReservation(reservation: InventoryReservation): Promise<InventoryReservation> {
      const values = reservationValues(reservation);
      await db.transaction(async (tx) => {
        await tx
          .insert(inventory_reservations)
          .values(values)
          .onConflictDoUpdate({
            target: inventory_reservations.id,
            set: {
              order_id: values.order_id,
              lines: values.lines,
              status: values.status,
              expiresAt: values.expiresAt,
              updatedAt: values.updatedAt,
            },
          });
      });

      return reservation;
    },

    async loadReservationById(id: InventoryReservationId): Promise<InventoryReservation | null> {
      const [row] = await db
        .select()
        .from(inventory_reservations)
        .where(eq(inventory_reservations.id, id))
        .limit(1);

      if (row === undefined) return null;
      return rowToReservation(row);
    },

    async saveReservation(reservation: InventoryReservation): Promise<void> {
      const values = reservationValues(reservation);
      await db.transaction(async (tx) => {
        await tx
          .insert(inventory_reservations)
          .values(values)
          .onConflictDoUpdate({
            target: inventory_reservations.id,
            set: {
              order_id: values.order_id,
              lines: values.lines,
              status: values.status,
              expiresAt: values.expiresAt,
              updatedAt: values.updatedAt,
            },
          });
      });
    },

    async findExpiredReservations(now: string): Promise<InventoryReservation[]> {
      const rows = await db
        .select()
        .from(inventory_reservations)
        .where(
          and(eq(inventory_reservations.status, "active"), lte(inventory_reservations.expiresAt, now)),
        );

      return rows.map(rowToReservation);
    },

    async recordAdjustments(adjustment: InventoryAdjustment): Promise<void> {
      await db.insert(inventory_adjustments).values({
        id: randomUUID(),
        variantId: adjustment.variantId,
        quantityDelta: adjustment.quantityDelta.toString(),
        reason: adjustment.reason,
        createdAt: new Date().toISOString(),
      });
    },
  };
}

