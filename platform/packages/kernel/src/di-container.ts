/**
 * Minimal DI or explicit factory graph for kernel services.
 *
 * Requirements:
 * - Avoid service locator anti-pattern in domain modules.
 *
 * TODO:
 * - [ ] Register kernel-scoped singletons: db, logger, feature flags.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Kernel
 */
export function createKernelContainer(): never {
  throw new Error("TODO: createKernelContainer — see file header JSDoc");
}

