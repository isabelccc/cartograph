# Billing — tax & promotions

## TODO

- [ ] External tax provider adapters (Vertex, TaxJar, …).
- [ ] Coupon rules: stackability, customer caps, schedules.

## Requirements

- Tax: basis points (`rateBps`), **floor** at each step unless policy says otherwise.
- Promotions: integer percent 0–100; document rounding.

## Function declarations

```ts
// billing/tax.ts
function taxFromRateBps(subtotalMinor: number, rateBps: number): number;
function allocateTaxAcrossLines(lineSubtotalsMinor: readonly number[], totalTaxMinor: number): number[];
function assertIntegerBps(rateBps: number): void;

// billing/promotion.ts
function applyPercentDiscount(subtotalMinor: number, percent: number): number;
function applyFixedDiscountMinor(subtotalMinor: number, discountMinor: number): number;
function clampPercent(percent: number): number;
```

Codes: `INVALID_SUBTOTAL`, `INVALID_RATE`, `INVALID_PERCENT`, `DISCOUNT_EXCEEDS_SUBTOTAL`.
