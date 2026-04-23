/**
 * Drizzle adapter for `CostEstimationRepositoryPort`.
 *
 * The table stores a JSON `payload` (bigint-unfriendly fields as string minor units).
 *
 * TODO:
 * - [ ] Add `status` column + index so `listNeedingReview` does not scan payloads.
 * - [ ] Validate parsed JSON with Zod instead of loose casts.
 *
 * @see ../../../../docs/COST-PREDICTION.md
 */
import { desc, eq } from "drizzle-orm";
import type { ProductIntakeId } from "../../../domain-contracts/src/index.js";
import { toProductIntakeId } from "../../../domain-contracts/src/index.js";
import type { Money } from "../../../domain-contracts/src/money.js";
import type { CostEstimationRepositoryPort } from "../../../modules/cost-estimation/cost-estimation.repository.port.js";
import type {
  ProductIntake,
  ProductIntakeStatus,
} from "../../../modules/cost-estimation/cost-estimation.types.js";
import type { AppDb } from "../client.js";
import { productIntakes } from "../schema/product_intakes.js";

type StoredMoney = { readonly amountMinor: string; readonly currency: string };

/** JSON shape inside `product_intakes.payload` (no bigint). */
type StoredProductIntakeBody = {
  readonly categoryCode: string;
  readonly schemaVersion: string;
  readonly status: ProductIntakeStatus;
  readonly rawPayload: Record<string, unknown>;
  readonly normalizedFeatures: Record<string, unknown> | null;
  readonly llmConfidence: number | null;
  readonly targetRetail: StoredMoney | null;
  readonly predictedCostPoint: StoredMoney | null;
  readonly predictedCostLow: StoredMoney | null;
  readonly predictedCostHigh: StoredMoney | null;
  readonly predictedAt: string | null;
  readonly modelVersion: string | null;
  readonly featureSchemaVersion: string | null;
};

function moneyToStored(m: Money | null): StoredMoney | null {
  if (!m) {
    return null;
  }
  return { amountMinor: m.amountMinor.toString(), currency: m.currency };
}

function moneyFromStored(m: StoredMoney | null): Money | null {
  if (!m) {
    return null;
  }
  return { amountMinor: BigInt(m.amountMinor), currency: m.currency };
}

function intakeToStoredBody(p: ProductIntake): StoredProductIntakeBody {
  return {
    categoryCode: p.categoryCode,
    schemaVersion: p.schemaVersion,
    status: p.status,
    rawPayload: { ...p.rawPayload },
    normalizedFeatures: p.normalizedFeatures ? { ...p.normalizedFeatures } : null,
    llmConfidence: p.llmConfidence,
    targetRetail: moneyToStored(p.targetRetail),
    predictedCostPoint: moneyToStored(p.predictedCostPoint),
    predictedCostLow: moneyToStored(p.predictedCostLow),
    predictedCostHigh: moneyToStored(p.predictedCostHigh),
    predictedAt: p.predictedAt,
    modelVersion: p.modelVersion,
    featureSchemaVersion: p.featureSchemaVersion,
  };
}

function rowToProductIntake(head: {
  id: string;
  payload: string;
  createdAt: string;
  updatedAt: string;
}): ProductIntake {
  let body: StoredProductIntakeBody;
  try {
    body = JSON.parse(head.payload) as StoredProductIntakeBody;
  } catch {
    throw new Error(`product_intakes ${head.id}: invalid JSON payload`);
  }
  return {
    id: toProductIntakeId(head.id),
    categoryCode: body.categoryCode,
    schemaVersion: body.schemaVersion,
    status: body.status,
    rawPayload: body.rawPayload,
    normalizedFeatures: body.normalizedFeatures,
    llmConfidence: body.llmConfidence,
    targetRetail: moneyFromStored(body.targetRetail),
    predictedCostPoint: moneyFromStored(body.predictedCostPoint),
    predictedCostLow: moneyFromStored(body.predictedCostLow),
    predictedCostHigh: moneyFromStored(body.predictedCostHigh),
    predictedAt: body.predictedAt,
    modelVersion: body.modelVersion,
    featureSchemaVersion: body.featureSchemaVersion,
    createdAt: head.createdAt,
    updatedAt: head.updatedAt,
  };
}

export function createCostEstimationRepository(db: AppDb): CostEstimationRepositoryPort {
  return {
    async getById(id: ProductIntakeId): Promise<ProductIntake | null> {
      const [head] = await db
        .select()
        .from(productIntakes)
        .where(eq(productIntakes.id, id))
        .limit(1);
      if (head === undefined) {
        return null;
      }
      return rowToProductIntake(head);
    },

    async save(intake: ProductIntake): Promise<void> {
      const payload = JSON.stringify(intakeToStoredBody(intake));
      await db
        .insert(productIntakes)
        .values({
          id: intake.id,
          payload,
          createdAt: intake.createdAt,
          updatedAt: intake.updatedAt,
        })
        .onConflictDoUpdate({
          target: productIntakes.id,
          set: {
            payload,
            updatedAt: intake.updatedAt,
          },
        });
    },

    async listNeedingReview(limit: number): Promise<readonly ProductIntake[]> {
      const rows = await db
        .select()
        .from(productIntakes)
        .orderBy(desc(productIntakes.updatedAt))
        .limit(500);
      const out: ProductIntake[] = [];
      for (const row of rows) {
        const intake = rowToProductIntake(row);
        if (intake.status === "needs_review") {
          out.push(intake);
          if (out.length >= limit) {
            break;
          }
        }
      }
      return out;
    },
  };
}
