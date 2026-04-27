/**
 * Drizzle table definitions: payments.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Persistence
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { orders } from "./orders.js";

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  amountMinor: text("amount_minor").notNull(),
  currency: text("currency").notNull(),
  providerRef: text("provider_ref"),
  metadataJson: text("metadata_json").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
