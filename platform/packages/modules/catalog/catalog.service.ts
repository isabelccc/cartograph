/**
 * catalog — catalog.service (service)
 *
 * ## Requirements
 *
 * - **R-DOM-1** — Use **`CatalogRepositoryPort` only**; no SQL/Drizzle here.
 * - **R-DOM-2** — Prices live on **`Variant.price`** (`Money`); products are aggregates with variants.
 * - **R-DOM-3** — If you add publish/draft lifecycle, use explicit transitions + typed errors (not booleans only).
 * - **Terra-style direction** — Later: per-**store** / **creator** catalog views, **design snapshots** on variants;
 *   keep service thin: resolve `storeId` → repo filter (when port supports it).
 *
 * ## Public API (factory return value)
 *
 * | Method | Purpose |
 * |--------|---------|
 * | **`listProducts`** | Storefront/admin listing; optional `activeOnly` filter. |
 * | **`getProductById`** | Load one product aggregate (includes embedded `variants` if your `Product` type holds them). |
 * | **`getVariantById`** | Price/SKU for cart & checkout (`cart.service` uses this path via port). |
 * | **`saveProduct`** | Create/update catalog (admin); validate invariants before calling repo. |
 *
 * TODO:
 * - [ ] Pagination (`PageRequest` / cursors) for `listProducts`.
 * - [ ] `publish` / `unpublish` commands if `Product` gains draft state.
 * - [ ] Channel/store-scoped lists when multi-tenant catalog exists.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — catalog
 */
import { DomainError } from "../../domain-contracts/src/errors.js";
import type { CatalogRepositoryPort } from "./catalog.repository.port.js";
import type { Product } from "./product.types.js";
import type { ProductId, Variant, VariantId } from "./variant.types.js";

export type CatalogServiceDeps = {
  readonly catalogRepo: CatalogRepositoryPort;
};

export function createCatalogService(deps: CatalogServiceDeps) {
  return {
    async listProducts(options?: {
      readonly activeOnly?: boolean;
    }): Promise<readonly Product[]> {
      return deps.catalogRepo.listProducts(options);
    },

    async getProductById(id: ProductId): Promise<Product | null> {
      return deps.catalogRepo.getById(id);
    },

    async getVariantById(id: VariantId): Promise<Variant | null> {
      return deps.catalogRepo.getByVariantId(id);
    },

    async saveProduct(product: Product): Promise<void> {
      for (const v of product.variants) {
        if (v.productId !== product.id) {
          throw new DomainError(
            "PRODUCT_ID_MISMATCH",
            "Variant.productId must equal product.id",
          );
        }
      }
   await deps.catalogRepo.save(product);
    },
  };
}

export type CatalogService = ReturnType<typeof createCatalogService>;
