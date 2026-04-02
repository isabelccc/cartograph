/**
 * Drizzle: `customers` table (SQLite).
 *
 * **PII (R-NF-6):** `email`, `name`, `shipping_address` — document retention/redaction in your policy.
 *
 * **Notes:**
 * - `email` unique is typical for B2C; relax if your model allows duplicates.
 * - `shipping_address` as a single text field is a simplification; split into columns or JSON later.
 * - `status`: enforce allowed values in domain (e.g. `active` | `disabled`) — SQLite has no enum.
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  /** PII; unique login identifier in many systems */
  email: text("email").unique().notNull(),
  /** PII */
  name: text("name").notNull(),
  status: text("status").notNull(),
  shippingAddress: text("shipping_address"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
