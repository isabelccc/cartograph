/**
 * Drizzle table definitions: products.
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

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  isActive: text("is_active").notNull(),
  optionsJson: text("options_json").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

