/**
 * Workflow barrel.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Workflows
 */
export type { StepResult } from "./workflow.types.js";
export type {
  CheckoutWorkflowDeps,
  CheckoutInput,
  CheckoutWorkflowResult,
} from "./checkout.workflow.js";
export { runCheckoutWorkflow } from "./checkout.workflow.js";
export type { OrderPlacedContext } from "./order-placed.workflow.js";
export { runOrderPlacedWorkflow } from "./order-placed.workflow.js";
export type { ReturnWorkflowDeps } from "./return.workflow.js";
export { runReturnWorkflow } from "./return.workflow.js";
