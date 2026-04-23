/**
 * Background job: enrich `ProductIntake.normalizedFeatures` from catalogs / historical quotes.
 *
 * TODO:
 * - [ ] Subscribe to queue events (e.g. after intake `ready` or on schedule).
 * - [ ] Pull supplier lead times, machine capabilities, commodity proxies; merge into feature JSON.
 * - [ ] Idempotent per `ProductIntakeId` (same pattern as outbox processors).
 *
 * @see ../../../../docs/COST-PREDICTION.md
 */
export function processCostIntakeEnrichment(_intakeId: string): never {
  throw new Error("TODO: processCostIntakeEnrichment — see file header JSDoc");
}
