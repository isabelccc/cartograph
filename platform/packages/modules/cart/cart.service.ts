/**
 * cart — cart.service (service)
 *
 * Requirements:
 * - R-DOM-1 ports only
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * TODO:
 * - [ ] addLine: load cart → pricing/catalog → merge or append line → persist via port
 * - [ ] mergeGuest, expire, TTL hooks
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — cart
 */
import type { AddCartLineInput, CartLine } from "./cart.types.js";
import type { CartId } from "../../domain-contracts/src/index.js";

/**
 * `addLine` usually needs **which cart** (`cartId`) plus **ports** (repo, catalog, pricing) in
 * `createCartService(deps)` — not only a raw line payload.
 *
 * Return type `CartLine` is the **fully built** row (id, money, title). **`AddCartLineInput`**
 * has no price — resolve `unitPrice` from a **pricing/catalog port**, using the cart’s currency
 * (load cart first). **`cartLineId`** comes from DB `RETURNING` / app `randomUUID` **after** you
 * define your persistence strategy (see JSDoc on `addLine` below).
 */
export function createCartService(): never {
  throw new Error("TODO: createCartService — see file header JSDoc");
}

/**
 * Correct flow (no direct SQL here):
 * 1. `cartRepo.findById(cartId)` → `Cart` (for `currency`, channel/region if you add them).
 * 2. `pricingPort` / `catalogPort` → `unitPrice: Money` (same currency as cart) + `title` string.
 * 3. `lineTotal = timesIntegerAmount(unitPrice, input.quantity)` (and `assertSameCurrency` if needed).
 * 4. `cartLineId = toCartLineId(randomUUID())` **or** id returned from `cartRepo.insertLine(...)`.
 * 5. Return `CartLine`; persist via port in the same transaction as you prefer.
 *
 * Do **not** trust a price sent from the client.
 */
export function addLine(_cartId: CartId, _input: AddCartLineInput): CartLine {
  void _cartId;
  void _input;
  throw new Error(
    "TODO: implement addLine via CartRepositoryPort + pricing/catalog ports (see JSDoc above)",
  );
}
