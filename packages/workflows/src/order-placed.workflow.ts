/**
 * Post–order-placed hooks (search index, notifications to external systems).
 * Extend here; keep idempotent at the subscriber.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Workflows
 */
import type { StepResult } from "./workflow.types.js";
import type { OrderId } from "../../domain-contracts/src/index.js";

export type OrderPlacedContext = {
  readonly orderId: OrderId;
};

export async function runOrderPlacedWorkflow(_ctx: OrderPlacedContext): Promise<StepResult> {
  void _ctx;
  return { ok: true };
}
