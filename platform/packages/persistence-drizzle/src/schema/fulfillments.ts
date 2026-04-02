/**
 * Drizzle table definitions: fulfillments.
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
export const fulfillments = sqliteTable("fulfillments", {
  id: text("id").primaryKey(),
  /** PII; unique login identifier in many systems */
  orderId: text("order_id").references(() => {
    orders.id,
    onDelete: "set null"
} ).notNull(),
  /** PII */
  name: text("name").notNull(),
  status: text("status").notNull(),
  shippingAddress: text("shipping_address"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export type Fulfillment = {
    readonly id: FulfillmentId;
    readonly orderId: OrderId;
    readonly lines: readonly FulfillmentLine[];
    readonly status: FulfillmentStatus;
    readonly carrier: string | null;
    readonly trackingNumber: string | null;
    readonly trackingUrl: string | null;
    readonly shippedAt: string | null;
    readonly deliveredAt: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
  };


