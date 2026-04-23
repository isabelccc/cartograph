/**
 * Admin HTTP routes: product intake + cost prediction (BFF).
 *
 * TODO:
 * - [ ] POST `/admin/product-intakes` — create draft from dynamic form payload.
 * - [ ] POST `/admin/product-intakes/:id/llm-enrich` — optional LLM assist.
 * - [ ] POST `/admin/product-intakes/:id/predict` — call `CostPredictorPort`.
 * - [ ] GET `/admin/product-intakes/needs-review` — queue for manual review.
 * - [ ] Wire `createCostEstimationService` with Drizzle repo + HTTP predictor adapter.
 *
 * @see ../../../../docs/COST-PREDICTION.md
 */
export const COST_INTAKE_ROUTES_TODO = true;
