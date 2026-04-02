/**
 * catalog — catalog.repository.port (port)
 *
 * Requirements:
 * - R-DOM-1: Interface only; persistence in `persistence-drizzle`.
 * - List endpoints should support filters (active, channel) as you add multi-tenant / Terra-style stores.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — catalog
 */
import type { Product } from "./product.types.js";
import type { ProductId, Variant, VariantId } from "./variant.types.js";

export interface CatalogRepositoryPort {
  getById(id: ProductId): Promise<Product | null>;
  getByVariantId(id: VariantId): Promise<Variant | null>;
  save(product: Product): Promise<void>;

  /** Browse catalog; `activeOnly` hides draft / discontinued (policy in service). */
  listProducts(options?: {
    readonly activeOnly?: boolean;
  }): Promise<readonly Product[]>;
}
