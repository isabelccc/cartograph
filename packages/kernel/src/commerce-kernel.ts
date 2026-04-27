/**
 * Vendure-like runtime (skeleton).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Kernel
 */
export type CommerceKernel = {
  readonly name: "cartograph-kernel";
  readonly version: string;
};

export function createCommerceKernel(): CommerceKernel {
  return { name: "cartograph-kernel", version: "0.0.0" };
}
