/**
 * Drizzle table definitions: order_lines.
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

export const orderLines = sqliteTable("order_lines", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  variantId: text("variant_id").notNull(),
  title: text("title").notNull(),
  quantity: text("quantity").notNull(),
  unitAmountMinor: text("unit_amount_minor").notNull(),
  lineTotalMinor: text("line_total_minor").notNull(),
});

