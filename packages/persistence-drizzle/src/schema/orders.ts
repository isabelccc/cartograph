/**
 * Drizzle table definitions: orders.
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
import { customers } from "./customers.js";

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  status: text("status").notNull(),
  currency: text("currency").notNull(),
  subtotalAmountMinor: text("subtotal_amount_minor").notNull(),
  totalAmountMinor: text("total_amount_minor").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

