/**
 * Drizzle: `carts` table (SQLite). Maps to domain `Cart` in the repository layer.
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { customers } from "./customers.js";

export const carts = sqliteTable("carts", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  customerId: text("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
