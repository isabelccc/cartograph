/**
 * catalog — variant.types (types)
 *
 * Requirements:
 * - Variant options (size, color, …) as structured data; SKU identity.
 * - R-DOM-2: `Money` for price in minor units.
 * - R-DOM-1: Services use ports, not Drizzle.
 *
 * TODO:
 * - [ ] Enforce option keys per product type (discriminated unions) if needed.
 * - [ ] Split “list price” vs “compare-at” if merchandising requires it.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — catalog
 */
import type {
  Money,
  ProductId,
  VariantId,
} from "../../domain-contracts/src/index.js";

export type { Money, ProductId, VariantId };

/** Sellable SKU / variant under a product. */
export type Variant = {
  readonly id: VariantId;
  readonly productId: ProductId;
  readonly title: string;
  /** e.g. `{ "color": "black", "size": "M" }` — keys depend on product definition. */
  readonly options: Record<string, string>;
  readonly price: Money;

  readonly compareAtPrice: Money;
  readonly stock: bigint;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};
