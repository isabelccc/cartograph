/**
 * cost-estimation — cost-estimation.types
 *
 * Category-scoped product intake + ML cost prediction boundaries.
 *
 * TODO:
 * - [ ] Replace `Record<string, unknown>` feature bags with versioned Zod/JSON Schema per `categoryCode`.
 * - [ ] Add `actualQuote: Money | null` when you wire label collection for model retraining.
 * - [ ] Add tenant / creator id fields when multi-tenant auth is fixed for this flow.
 *
 * @see ../../../../docs/COST-PREDICTION.md
 */
import type { Money } from "../../domain-contracts/src/money.js";
import type { ProductIntakeId } from "../../domain-contracts/src/index.js";

export type { ProductIntakeId };

/** Intake lifecycle for LLM review + model scoring. */
export type ProductIntakeStatus =
  | "draft"
  | "needs_review"
  | "ready"
  | "predicted"
  | "labeled";

/**
 * One creator submission row (normalized JSON + optional model outputs).
 * Persist as JSON columns in Supabase/SQLite; see `docs/COST-PREDICTION.md`.
 */
export type ProductIntake = {
  readonly id: ProductIntakeId;
  readonly categoryCode: string;
  readonly schemaVersion: string;
  readonly status: ProductIntakeStatus;
  /** Validated form payload from the dynamic generator. */
  readonly rawPayload: Readonly<Record<string, unknown>>;
  /** Feature vector for regression (filled after normalize / LLM / enrichment jobs). */
  readonly normalizedFeatures: Readonly<Record<string, unknown>> | null;
  /** Overall LLM confidence in \[0, 1\]; `null` if LLM not run. */
  readonly llmConfidence: number | null;
  readonly targetRetail: Money | null;
  readonly predictedCostPoint: Money | null;
  readonly predictedCostLow: Money | null;
  readonly predictedCostHigh: Money | null;
  readonly predictedAt: string | null;
  readonly modelVersion: string | null;
  readonly featureSchemaVersion: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type CostPredictionResult = {
  readonly predictedPoint: Money;
  readonly low: Money;
  readonly high: Money;
  readonly modelVersion: string;
  readonly featureSchemaVersion: string;
};
