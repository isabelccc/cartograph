/**
 * StepResult, compensation hooks.
 *
 * Requirements:

 *
 * TODO:
 * - [ ] Durable workflow instance typing
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Workflows
 */
export type StepResult = { ok: true } | { ok: false; reason: string };

