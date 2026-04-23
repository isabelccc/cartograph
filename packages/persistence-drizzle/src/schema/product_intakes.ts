/**
 * Drizzle: product intakes for cost prediction (RFQ / creator specs).
 *
 * TODO:
 * - [ ] Replace single JSON `payload` with normalized columns + `Money` split fields when stable.
 * - [ ] Add migration under `src/migrations/` and run `drizzle-kit generate`.
 * - [ ] Implement `CostEstimationRepositoryPort` in `src/repositories/product-intake.repository.ts`.
 *
 * @see ../../../../docs/COST-PREDICTION.md
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const productIntakes = sqliteTable("product_intakes", {
  id: text("id").primaryKey(),
  /** Serialized `ProductIntake`-shaped JSON until columns are normalized. */
  payload: text("payload").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
