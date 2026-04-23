/**
 * cost-estimation — cost-estimation.service
 *
 * Orchestrates: validate intake → optional LLM → persist → call predictor → flag vs target retail.
 *
 * TODO:
 * - [ ] Parse `targetRetail` from `rawPayload` (or extend `createDraftIntake` input) when forms send it.
 * - [ ] Apply configurable margin threshold vs `targetRetail` and persist flag / suggestions.
 * - [ ] Centralize stricter status transitions (R-DOM-3) once rules are fixed.
 *
 * @see ../../../../docs/COST-PREDICTION.md
 */
import { DomainError, toProductIntakeId } from "../../domain-contracts/src/index.js";
import { assertSameCurrency } from "../../domain-contracts/src/money.js";
import type { CostIntakeLlmEnricherPort } from "./cost-estimation.llm-enricher.port.js";
import type { CostPredictorPort } from "./cost-estimation.predictor.port.js";
import type { CostEstimationRepositoryPort } from "./cost-estimation.repository.port.js";
import type { ProductIntake, ProductIntakeId } from "./cost-estimation.types.js";

export type CreateDraftIntakeInput = {
  categoryCode: string;
  schemaVersion: string;
  rawPayload: Readonly<Record<string, unknown>>;
};

function nowIso(): string {
  return new Date().toISOString();
}

const DEFAULT_LLM_REVIEW_THRESHOLD = 0.85;

export type CostEstimationServiceDeps = {
  readonly intakeRepo: CostEstimationRepositoryPort;
  readonly predictor: CostPredictorPort;
  /** Omit when LLM path is disabled for an environment. */
  readonly llmEnricher?: CostIntakeLlmEnricherPort;
  /** Below this overall LLM confidence, status becomes `needs_review`. */
  readonly llmReviewConfidenceMin?: number;
};

export function createCostEstimationService(deps: CostEstimationServiceDeps) {
  const llmMin = deps.llmReviewConfidenceMin ?? DEFAULT_LLM_REVIEW_THRESHOLD;

  return {
    async createDraftIntake(input: CreateDraftIntakeInput): Promise<ProductIntake> {
      const t = nowIso();
      const intake: ProductIntake = {
        id: toProductIntakeId(crypto.randomUUID()),
        categoryCode: input.categoryCode,
        schemaVersion: input.schemaVersion,
        status: "draft",
        rawPayload: input.rawPayload,
        normalizedFeatures: null,
        llmConfidence: null,
        targetRetail: null,
        predictedCostPoint: null,
        predictedCostLow: null,
        predictedCostHigh: null,
        predictedAt: null,
        modelVersion: null,
        featureSchemaVersion: null,
        createdAt: t,
        updatedAt: t,
      };
      await deps.intakeRepo.save(intake);
      return intake;
    },

    async getIntakeById(id: ProductIntakeId): Promise<ProductIntake | null> {
      return deps.intakeRepo.getById(id);
    },

    async enrichIntakeWithLlm(id: ProductIntakeId, rawText: string): Promise<ProductIntake> {
      if (!deps.llmEnricher) {
        throw new DomainError("COST_INTAKE_LLM_DISABLED", "LLM enricher is not configured");
      }
      const existing = await deps.intakeRepo.getById(id);
      if (!existing) {
        throw new DomainError("COST_INTAKE_NOT_FOUND", "intake does not exist");
      }

      const result = await deps.llmEnricher.mapFreeTextToSchema({
        categoryCode: existing.categoryCode,
        schemaVersion: existing.schemaVersion,
        rawText,
      });

      const base = existing.normalizedFeatures ?? {};
      const normalizedFeatures: Readonly<Record<string, unknown>> = {
        ...base,
        ...result.proposedFields,
      };
      const status = result.confidence < llmMin ? "needs_review" : "ready";
      const updated: ProductIntake = {
        ...existing,
        normalizedFeatures,
        llmConfidence: result.confidence,
        status,
        updatedAt: nowIso(),
      };
      await deps.intakeRepo.save(updated);
      return updated;
    },

    async predictCostForIntake(id: ProductIntakeId): Promise<ProductIntake> {
      const existing = await deps.intakeRepo.getById(id);
      if (!existing) {
        throw new DomainError("COST_INTAKE_NOT_FOUND", "intake does not exist");
      }
      if (!existing.normalizedFeatures) {
        throw new DomainError(
          "COST_INTAKE_NOT_FEATURIZED",
          "normalizedFeatures is required before prediction",
        );
      }

      const featureSchemaVersion = existing.featureSchemaVersion ?? existing.schemaVersion;
      const prediction = await deps.predictor.predict({
        normalizedFeatures: existing.normalizedFeatures,
        targetRetail: existing.targetRetail,
        featureSchemaVersion,
      });

      assertSameCurrency(prediction.low, prediction.predictedPoint);
      assertSameCurrency(prediction.predictedPoint, prediction.high);
      if (existing.targetRetail) {
        assertSameCurrency(existing.targetRetail, prediction.predictedPoint);
      }

      const updated: ProductIntake = {
        ...existing,
        featureSchemaVersion: prediction.featureSchemaVersion,
        predictedCostPoint: prediction.predictedPoint,
        predictedCostLow: prediction.low,
        predictedCostHigh: prediction.high,
        predictedAt: nowIso(),
        modelVersion: prediction.modelVersion,
        status: "predicted",
        updatedAt: nowIso(),
      };
      await deps.intakeRepo.save(updated);
      return updated;
    },

    async listIntakesNeedingReview(limit: number): Promise<readonly ProductIntake[]> {
      return deps.intakeRepo.listNeedingReview(limit);
    },
  };
}

export type CostEstimationService = ReturnType<typeof createCostEstimationService>;
