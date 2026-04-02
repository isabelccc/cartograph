# Checkout

## TODO

- [ ] Idempotent `POST /checkout` with `Idempotency-Key`.
- [ ] Address + shipping method validation providers.

## Requirements

- Return **machine codes** only from domain (`EMPTY_CART`, …); localize at edge.
- `validateCheckoutWithContext` must consider channel + payment readiness flags.

## Types (`modules/types/checkout.ts`)

- `CheckoutContext`, `CheckoutValidationInput`

## Function declarations (`modules/checkout/checkout.ts`)

```ts
function validateCheckoutReadiness(cart: Cart): string[];
function validateCheckoutWithContext(input: CheckoutValidationInput): string[];
function mergeCheckoutErrorCodes(base: readonly string[], extra: readonly string[]): string[];
```
