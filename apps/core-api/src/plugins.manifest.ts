/**
 * Register core + community plugins (manifest).
 *
 * **Fail-fast:** load errors propagate — process should not start half-configured.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Plugins
 */
import { createCoreDefaultsPlugin } from "../../../plugins/core-defaults/src/index.js";
import type { CommercePlugin } from "../../../packages/kernel/src/plugin.types.js";
import type { RequestLogger } from "./config/logger.js";
import type { Env } from "./config/env.schema.js";
import type { PluginsManifest } from "./plugins.types.js";

export function loadPlugins(opts: { env: Env; logger: RequestLogger }): PluginsManifest {
  const plugins: CommercePlugin[] = [];
  if (!opts.env.pluginCoreDefaultsDisabled) {
    try {
      plugins.push(createCoreDefaultsPlugin());
    } catch (err) {
      opts.logger.error("plugin_load_failed", {
        plugin: "core-defaults",
        err: String(err),
      });
      throw err;
    }
  }
  return plugins;
}
