import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { orders } from "./orders.js";
import { variants } from "./variants.js";

/**
 * Drizzle table definitions: inventory.
 *
 * Requirements:
 * - Indexes on hot paths: orders.customer_id, payments.order_id, outbox.published_at (per SERIES-B).
 * - R-NF-6: document PII columns.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Persistence
 */
export const inventory_reservations = sqliteTable("inventory_reservations", {
  id: text("id").primaryKey(),
  order_id: text("order_id").references(() => orders.id, { onDelete: "cascade" }),
  lines: text("lines").notNull(),
  status: text("status").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const inventory_stock_levels = sqliteTable("inventory_stock_levels", {
  variantId: text("variant_id").primaryKey(),
  sku: text("sku").notNull(),
  onHand: text("on_hand").notNull().default("0"),
  reserved: text("reserved").notNull().default("0"),
  availableToPromise: text("available_to_promise").notNull().default("0"),
  updatedAt: text("updated_at").notNull(),
});

export const inventory_adjustments = sqliteTable("inventory_adjustments", {
  id: text("id").primaryKey().notNull(),
  variantId: text("variant_id")
    .notNull()
    .references(() => variants.id, { onDelete: "cascade" }),
  quantityDelta: text("quantity_delta").notNull(),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull(),
});
