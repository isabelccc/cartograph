/**
 * Drizzle table definitions: tax_rates.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Persistence
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const taxRates = sqliteTable("tax_rates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  countryCode: text("country_code").notNull(),
  rateBps: text("rate_bps").notNull(),
  isActive: text("is_active").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
