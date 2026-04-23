# Cost prediction — repo map

This ties the predictive cost workflow to **Cartograph** layouts: domain ports, persistence, apps, worker, and external services.

## Domain module (`packages/modules/cost-estimation/`)

| File | Role |
|------|------|
| `cost-estimation.types.ts` | `ProductIntake`, statuses, `CostPredictionResult`; TODO versioned schemas per category. |
| `cost-estimation.repository.port.ts` | Load/save intake rows; `listNeedingReview`. |
| `cost-estimation.llm-enricher.port.ts` | Free text → proposed fields + confidence. |
| `cost-estimation.predictor.port.ts` | Regression API client boundary. |
| `cost-estimation.service.ts` | Public orchestration API (`CostEstimationService`); factory stub. |

## Identifiers (`packages/domain-contracts/src/ids.ts`)

- `ProductIntakeId` + `toProductIntakeId()` for typed intake ids.

## Persistence (`packages/persistence-drizzle/`)

| Item | Role |
|------|------|
| `src/schema/product_intakes.ts` | SQLite table stub (`payload` JSON v1). |
| `src/schema/index.ts` | Exports `productIntakes`. |

**TODO:** Add migration, map `ProductIntake` ↔ row (especially `Money` fields), implement `CostEstimationRepositoryPort` under `src/repositories/`.

## HTTP surface

| Location | Role |
|----------|------|
| `apps/admin-bff/src/routes/cost-intake.routes.stub.ts` | Checklist for admin-only intake + predict endpoints. |

**TODO:** Optionally expose read-only predict from `apps/core-api` if storefront needs estimates (policy decision).

## Worker

| File | Role |
|------|------|
| `apps/worker/src/processors/cost-intake-enrichment.ts` | Background enrichment of feature JSON. |

**TODO:** Register job in `apps/worker/src/main.ts` when queue exists.

## External services (outside this package)

| Piece | Role |
|-------|------|
| LLM microservice | Implements mapping behind `CostIntakeLlmEnricherPort`. |
| Python (or other) inference API | Implements regression; called via `CostPredictorPort`. |
| Supabase (optional) | If you host Postgres + JSONB here instead of SQLite; keep the same domain ports. |

## Training / MLOps (repo-external or future folder)

- **TODO:** Add `services/ml-cost-api/` (or separate repo) with training script, model registry, and `model_version` / `feature_schema_version` alignment to `CostPredictionResult`.

## Tests

| File | Role |
|------|------|
| `tests/contract/cost-estimation.intake.contract.ts` | API contract stubs. |

## Rollout checklist

1. Versioned JSON Schema per `categoryCode` (replace `Record<string, unknown>`).
2. Implement `createCostEstimationService` + Drizzle repository.
3. Ship predictor HTTP service; wire env URL in admin-bff/core-api config.
4. Add LLM adapter + review queue threshold.
5. Log labels (`actualQuote`) for retraining; schedule batch retrains.
