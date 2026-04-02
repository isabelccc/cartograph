/**
 * Drizzle: `cart_lines` table. Maps to domain `CartLine` in the repository layer.
 *
 * SQLite: store bigint minor units / quantities as **text** (decimal string) to avoid precision loss.
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { carts } from "./carts.js";

export const cartLines = sqliteTable("cart_lines", {
  id: text("id").primaryKey(),
  cartId: text("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  variantId: text("variant_id").notNull(),
  title: text("title").notNull(),
  quantity: text("quantity").notNull(),
  unitAmountMinor: text("unit_amount_minor").notNull(),
  lineTotalMinor: text("line_total_minor").notNull(),
});
