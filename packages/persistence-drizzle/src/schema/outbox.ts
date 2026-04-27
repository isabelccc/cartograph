/**
 * Outbox table for reliable side-effects (domain events → webhooks, search, etc.).
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const outbox = sqliteTable("outbox", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull(),
  publishedAt: text("published_at"),
});
