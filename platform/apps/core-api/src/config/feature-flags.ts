/**
 * Feature flags (LaunchDarkly / Unleash / static map).
 *
 * Requirements:
 * - R-NF-4: High-risk flows (new checkout, new payment paths) must be disableable via flags.
 * - Evaluation results must be injectable into request context for logging and audit correlation.
 *
 * TODO:
 * - [ ] Define a `FeatureFlags` interface: `isEnabled(key, context)`.
 * - [ ] Ship a static-map implementation for local dev; swap for a remote provider in production.
 * - [ ] Maintain initial flag keys in comments: `checkout_v2`, `async_capture`, etc.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — R-NF-4
 */
export type FeatureFlagContext = {
  /** TODO: tenantId, userId, channelId, … */
  readonly placeholder?: string;
};

export function createFeatureFlags(): never {
  throw new Error("TODO: feature-flags — see file header JSDoc");
}
