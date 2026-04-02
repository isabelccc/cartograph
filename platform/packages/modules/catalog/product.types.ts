/**
 * catalog — product.types (types)
 *
 * Requirements:
 * - Publish/draft
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * TODO:
 * - [ ] Product aggregate
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — catalog
 */

import type { Variant,ProductId } from "./variant.types.js";

export type {ProductId };

export type Product ={
    readonly id:ProductId,
    readonly title:string,
    readonly description:string,
    readonly isActive: boolean;
    readonly options: string[],
    readonly variants: Variant[],
    readonly createdAt: string;
    readonly updatedAt: string;

}

