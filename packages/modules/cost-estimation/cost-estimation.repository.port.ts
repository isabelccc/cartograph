/**
 * cost-estimation — cost-estimation.repository.port
 *
 * TODO:
 * - [ ] Implement in `packages/persistence-drizzle` (table `product_intakes` — see docs/COST-PREDICTION.md).
 * - [ ] Map `Money` ↔ amount_minor + currency columns.
 *
 * @see ../../../../docs/COST-PREDICTION.md
 */
import type { ProductIntake, ProductIntakeId } from "./cost-estimation.types.js";

export interface CostEstimationRepositoryPort {
  getById(id: ProductIntakeId): Promise<ProductIntake | null>;
  save(intake: ProductIntake): Promise<void>;
  listNeedingReview(limit: number): Promise<readonly ProductIntake[]>;
}
