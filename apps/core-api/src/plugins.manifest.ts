/**
 * Register core + community plugins (manifest).
 *
 * Requirements:
 * - Plugin metadata matches `plugins/。。/plugin.json` (name, version, contributes).
 * - Payment plugins implement `payment.provider.port` only; they must not mutate order aggregates directly (SERIES-B).
 *
 * TODO:
 * - [ ] Export plugin instances or factories: `core-defaults`, `payment-stripe` (optional), `shipping-flat-rate`, `search-meilisearch`.
 * - [ ] Toggle optional plugins via env.
 * - [ ] Log load failures to structured logs; fail-fast or degrade (document the policy).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Plugins
 */
import type { PluginsManifest } from "./plugins.types.js";

export function loadPlugins(): PluginsManifest {
  // TODO: read env, instantiate plugin factories, return ordered list.
  return [];
}
