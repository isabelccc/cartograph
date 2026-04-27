/**
 * Flat-rate shipping plugin (stub).
 */
import type { CommercePlugin } from "../../../packages/kernel/src/plugin.types.js";

export function createPlugin(): CommercePlugin {
  return {
    name: "shipping-flat-rate",
    version: "0.0.0",
  };
}
