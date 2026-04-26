/**
 * Drizzle table definitions: variants.
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
import { products } from "./products.js";

export const variants = sqliteTable("variants", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  optionsJson: text("options_json").notNull(),
  priceAmountMinor: text("price_amount_minor").notNull(),
  priceCurrency: text("price_currency").notNull(),
  compareAtAmountMinor: text("compare_at_amount_minor").notNull(),
  compareAtCurrency: text("compare_at_currency").notNull(),
  stock: text("stock").notNull(),
  isActive: text("is_active").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

