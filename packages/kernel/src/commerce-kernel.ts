/**
 * Vendure-like runtime: plugin registry, lifecycle, merged config.
 *
 * Requirements:
 * - Ordered plugin lifecycle: configure → registerServices → registerWorkflows.
 * - Config merge policy documented (last-wins or explicit precedence).
 *
 * TODO:
 * - [ ] Implement `CommerceKernel` class or factory holding plugin list.
 * - [ ] Expose hooks for HTTP and worker to attach.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Kernel
 */
export function createCommerceKernel(): never {
  throw new Error("TODO: createCommerceKernel — see file header JSDoc");
}

