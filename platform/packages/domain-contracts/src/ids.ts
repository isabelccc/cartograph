/**
 * Branded identifiers: OrderId, CustomerId, CartId (extend as modules need more).
 *
 * Requirements:
 * - IDs opaque to callers; no numeric auto-increment leakage in APIs if policy requires.
 *
 * TODO (this file):
 * - [x] Branded string types for OrderId, CustomerId, CartId.
 * - [ ] Add remaining commerce IDs when you wire modules: ProductId, VariantId, PaymentId,
 *       FulfillmentId, PromotionId, TenantId, etc. (keep one brand literal per type).
 * - [ ] Add `to*Id(raw: string)` helpers for each type (already started below — extend the set).
 * - [ ] Replace unchecked `as` casts inside `to*Id` with validation (UUID / ULID / prefix / regex)
 *       and throw a typed parse error or return `Result` from domain-contracts/errors.
 * - [ ] Document ID format (e.g. `ord_`, `cus_` prefixes) in a single comment block once chosen.
 * - [ ] Ensure `index.ts` re-exports all public types and functions from this file.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — domain-contracts
 */
export type OrderId = string & { readonly __brand: "OrderId" };

export type CustomerId = string & { readonly __brand: "CustomerId" };

export type CartId = string & { readonly __brand: "CartId" };

export type VariantId = string & { readonly __brand: "VariantId" };

export type ProductId = string & { readonly __brand: "ProductId" };

/** One row inside a cart (distinct from `CartId`). */
export type CartLineId = string & { readonly __brand: "CartLineId" };

export type FulfillmentId = string & {readonly __brand: "FulfillmentId"}

export type SessionId = string & {readonly __brand: "SessionId"};
/** Cast after validating shape at HTTP/DB boundaries (see TODO above). */
export function toOrderId(id: string): OrderId {
  return id as OrderId;
}

export function toCustomerId(id: string): CustomerId {
  return id as CustomerId;
}

export function toCartId(id: string): CartId {
  return id as CartId;
}

export function toCartLineId(id: string): CartLineId {
  return id as CartLineId;
}

export function toProductId(id: string): ProductId {
  return id as ProductId;
}

export function toVariantId(id: string): VariantId {
  return id as VariantId;
}

export function toSessionId(id:string):SessionId{
    return id as SessionId;
}

export function toFullfillmentId(id:string):FulfillmentId{
    return id as FulfillmentId
}
