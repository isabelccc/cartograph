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
import { sqliteTable,text } from "drizzle-orm/sqlite-core";
export const orders = sqliteTable("orders",{
    id: text("id").primaryKey()
});

