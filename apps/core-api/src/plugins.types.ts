/**
 * Shared plugin-list types for core-api (avoids `app.ts` ↔ `plugins.manifest.ts` import cycles).
 */
import type { CommercePlugin } from "../../../packages/kernel/src/plugin.types.js";

export type PluginsManifest = readonly CommercePlugin[];
