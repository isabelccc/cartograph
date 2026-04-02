/**
 * cart — cart.service (service)
 *
 * Requirements:
 * - R-DOM-1: Use injected **ports** only (`CartRepositoryPort`, `CatalogRepositoryPort`).
 * - Do **not** import `db` or BFF from here — wire repos in the app entry.
 *
 * TODO:
 * - [x] Merge same variant line + `cartRepo.save`.
 * - [ ] Optional: single DB transaction if cart + inventory must commit together.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — cart
 */
import { randomUUID } from "node:crypto";
import type { CatalogRepositoryPort } from "../catalog/catalog.repository.port.js";
import type { CartRepositoryPort } from "./cart.repository.port.js";
import type { AddCartLineInput, Cart, CartLine } from "./cart.types.js";
import {
  DomainError,
  timesIntegerAmount,
  toCartLineId,
  type CartId,
} from "../../domain-contracts/src/index.js";

export type CartServiceDeps = {
  readonly cartRepo: CartRepositoryPort;
  readonly catalogRepo: CatalogRepositoryPort;
};

/**
 * Factory: `const cartService = createCartService({ cartRepo, catalogRepo })`.
 */
export function createCartService(deps: CartServiceDeps) {
  return {
    async addLine(cartId: CartId, input: AddCartLineInput): Promise<CartLine> {
      if (input.quantity < 0n) {
        throw new DomainError("CART_LINE_QTY_INVALID", "quantity must be >= 0");
      }

      const cart = await deps.cartRepo.getById(cartId);
      if (cart === null) {
        throw new DomainError("CART_NOT_FOUND", "Cart not found");
      }

      const product = await deps.catalogRepo.getById(input.productId);
      if (product === null) {
        throw new DomainError("PRODUCT_NOT_FOUND", "Product not found");
      }

      const variant = await deps.catalogRepo.getByVariantId(input.variantId);
      if (variant === null) {
        throw new DomainError("VARIANT_NOT_FOUND", "Variant not found");
      }

      if (variant.productId !== input.productId) {
        throw new DomainError(
          "VARIANT_PRODUCT_MISMATCH",
          "Variant does not belong to this product",
        );
      }

      if (variant.price.currency !== cart.currency) {
        throw new DomainError(
          "CART_CURRENCY_MISMATCH",
          "Variant price currency does not match cart currency",
        );
      }

      const unitPrice = variant.price;
      const title = `${product.title} — ${variant.title}`;

      /** Merge key: same product + variant → increase quantity; never mutate `cart.lines` in place (readonly). */
      const existingIndex = cart.lines.findIndex(
        (l) =>
          l.variantId === input.variantId && l.productId === input.productId,
      );

      let resultLine: CartLine;

      if (existingIndex >= 0) {
        const existing = cart.lines[existingIndex]!;
        const combinedQty = existing.quantity + input.quantity;
        const newLineTotal = timesIntegerAmount(unitPrice, combinedQty);
        resultLine = {
          ...existing,
          quantity: combinedQty,
          unitPrice,
          lineTotal: newLineTotal,
          title,
        };
      } else {
        resultLine = {
          cartLineId: toCartLineId(randomUUID()),
          productId: input.productId,
          variantId: input.variantId,
          title,
          quantity: input.quantity,
          unitPrice,
          lineTotal: timesIntegerAmount(unitPrice, input.quantity),
        };
      }

      const nextLines: readonly CartLine[] =
        existingIndex >= 0
          ? cart.lines.map((l, i) => (i === existingIndex ? resultLine : l))
          : [...cart.lines, resultLine];

      const updatedCart: Cart = {
        ...cart,
        lines: nextLines,
        updatedAt: new Date().toISOString(),
      };

      await deps.cartRepo.save(updatedCart);
      return resultLine;
    },
  };
}

export type CartService = ReturnType<typeof createCartService>;
