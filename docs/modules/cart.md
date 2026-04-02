# Cart

## TODO

- [ ] Merge guest → logged-in cart (conflict rules).
- [ ] Promotions application + snapshot at checkout.

## Requirements

- Immutable-style updates: return **new** cart; do not mutate input.
- Quantities: positive integers.

## Function declarations (`modules/cart/cart.ts`)

```ts
function addCartLine(cart: Cart, line: CartLine): Cart;
function removeCartLine(cart: Cart, variantId: string): Cart;
function setLineQuantity(cart: Cart, variantId: string, quantity: number): Cart;
function totalUnits(cart: Cart): number;
```

Codes: `INVALID_QUANTITY`, `LINE_NOT_FOUND`.
