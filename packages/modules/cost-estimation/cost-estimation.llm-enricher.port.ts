/**
 * cost-estimation — cost-estimation.llm-enricher.port
 *
 * Lightweight LLM microservice: free text / notes → schema fields + confidence.
 *
 * TODO:
 * - [ ] Implement HTTP adapter calling your LLM worker (OpenAI, etc.); enforce JSON-only response schema.
 * - [ ] Redact PII before sending to the model if policy requires.
 *
 * @see ../../../../docs/COST-PREDICTION.md
 */
export type LlmEnrichmentInput = {
  readonly categoryCode: string;
  readonly schemaVersion: string;
  readonly rawText: string;
};

export type LlmEnrichmentResult = {
  readonly proposedFields: Readonly<Record<string, unknown>>;
  readonly confidence: number;
  readonly perFieldConfidence: Readonly<Record<string, number>> | null;
};

export interface CostIntakeLlmEnricherPort {
  mapFreeTextToSchema(input: LlmEnrichmentInput): Promise<LlmEnrichmentResult>;
}
