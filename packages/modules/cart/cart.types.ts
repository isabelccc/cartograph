/**
 * cart — cart.types (types)
 *
 * Requirements:
 * - R-DOM-2: Money uses minor units (`Money` from domain-contracts); same currency as parent `Cart`.
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * TODO:
 * - [x] `CartLine` shape: ids, quantity, `Money`, display snapshot.
 * - [x] `Cart.lines` on aggregate; use `readonly CartLine[]` for immutability.
 * - [ ] Guest vs logged-in policy for `customerId` / `sessionId`; DB column naming (`snake_case`).
 * - [x] Branded `CartLineId` in `domain-contracts/ids.ts`.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — cart
 */
import type {
  CartId,
  CartLineId,
  CustomerId,
  Money,
  ProductId,
  VariantId,
  SessionId
} from "../../domain-contracts/src/index.js";

export type {
  CartId,
  CartLineId,
  CustomerId,
  Money,
  ProductId,
  VariantId,
  SessionId
};

export type Cart = {
  readonly id: CartId;
  /** Present when cart is tied to a registered customer. */
  readonly customerId?: CustomerId | undefined;
  /** Guest / device continuity before login. */
  readonly sessionId: SessionId;
  readonly currency: string;
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lines: readonly CartLine[];
};

export type CartLine = {
  readonly cartLineId: CartLineId;
  readonly productId: ProductId;
  readonly variantId: VariantId;
  /** Display snapshot (product + variant label). */
  readonly title: string;
  /** Whole units; service layer should reject negative values. */
  readonly quantity: bigint;
  /** Unit price in cart currency (R-DOM-2). */
  readonly unitPrice: Money;
  /** Line total; usually `unitPrice × quantity` — keep in sync in domain rules or recompute. */
  readonly lineTotal: Money;
};

/**
 * Input for “add line” **before** the service assigns `cartLineId`, resolves `title`, and loads
 * `unitPrice` / `lineTotal` (from catalog + pricing ports). Not the same shape as `CartLine`.
 */
export type AddCartLineInput = {
  readonly productId: ProductId;
  readonly variantId: VariantId;
  readonly quantity: bigint;
};
