/**
 * Barrel exports for the commerce kernel package.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Kernel
 */
export { bootstrap } from "./bootstrap.js";
export { createCommerceKernel, type CommerceKernel } from "./commerce-kernel.js";
export { createKernelContainer } from "./di-container.js";
export type { AsyncPluginHandler, CommercePlugin, CommercePluginRouteContext } from "./plugin.types.js";
