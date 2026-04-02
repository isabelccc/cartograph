/**
 * Drizzle table definitions: fulfillments.
 *
 * Requirements:
 * - Indexes on hot paths: orders.customer_id, payments.order_id, outbox.published_at (per SERIES-B).
 * - R-NF-6: document PII columns.
 *
 * TODO:
 * - [ ] Define sqliteTable/pgTable matching domain-contracts.
 * - [ ] Export from schema/index.ts
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Persistence
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { orders } from "./orders.js";
export const fulfillments = sqliteTable("fulfillments", {
  id: text("id").primaryKey(),
  /** PII; unique login identifier in many systems */
  orderId: text("order_id")
  .notNull()
  .references(() => orders.id, { onDelete: "cascade" }),
  /** PII */
  lines: text("lines").notNull(),
  status: text("status").notNull(),
  carrier: text("carrier"),
  trackingNumber: text("trackingNumber"),
  trackingUrl: text("trackingUrl"),
  shippedAt: text("shippedAt"),
  deliveredAt: text("deliveredAt"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});



