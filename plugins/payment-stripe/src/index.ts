/**
 * Plugin entry: payment-stripe.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Plugins
 */
import type { CommercePlugin } from "../../../packages/kernel/src/plugin.types.js";

export function createPlugin(): CommercePlugin {
  return {
    name: "payment-stripe",
    version: "0.0.0",
  };
}

export { createStripePaymentProvider } from "./stripe.provider.js";
