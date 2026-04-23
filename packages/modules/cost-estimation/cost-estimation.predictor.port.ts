/**
 * cost-estimation — cost-estimation.predictor.port
 *
 * Regression model deployed as HTTP (Python FastAPI, etc.).
 *
 * TODO:
 * - [ ] Implement fetch client with timeouts, retries, and `model_version` logging.
 * - [ ] Add circuit breaker when inference SLO is missed.
 *
 * @see ../../../../docs/COST-PREDICTION.md
 */
import type { Money } from "../../domain-contracts/src/money.js";
import type { CostPredictionResult } from "./cost-estimation.types.js";

export type CostPredictorInput = {
  readonly normalizedFeatures: Readonly<Record<string, unknown>>;
  readonly targetRetail: Money | null;
  readonly featureSchemaVersion: string;
};

export interface CostPredictorPort {
  predict(input: CostPredictorInput): Promise<CostPredictionResult>;
}
