/**
 * Feature flags (LaunchDarkly / Unleash / static map).
 *
 * Requirements:
 * - R-NF-4: High-risk flows must be disableable via flags.
 *
 * **Local dev:** use `parseEnv()` — `Env.featureFlags` is populated from
 * `FEATURE_CHECKOUT_V2`, `FEATURE_ASYNC_CAPTURE`, etc.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — R-NF-4
 */
export type FeatureFlagContext = {
  readonly tenantId?: string;
  readonly userId?: string;
};

/** Keys mirrored in `env.schema.ts` (checkout_v2, async_capture, …). */
export function createFeatureFlags(map: Record<string, boolean>): Record<string, boolean> {
  return { ...map };
}
