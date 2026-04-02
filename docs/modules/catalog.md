# Catalog — variants & pricing

## TODO

- [ ] Publish/draft, collections, translations, metadata JSON schema.
- [ ] Price lists per channel/region (Medusa-style).

## Requirements

- Display name: non-empty trimmed `title`, else `sku`.
- Money: **integer minor units** only; reject floats.

## Function declarations

```ts
// catalog/catalog.ts
function variantDisplayName(v: ProductVariant): string;
function assertWellFormedSku(sku: string): void;
function sortVariantsForDisplay(variants: readonly ProductVariant[]): ProductVariant[];
function variantPackingLabel(v: ProductVariant): string;

// catalog/pricing.ts
function lineSubtotalMinor(unitPriceMinor: number, quantity: number): number;
function assertMinorUnitsNonNegative(label: string, n: number): void;
function subtractDiscountMinor(subtotalMinor: number, discountMinor: number): number;
function minorTotalsEqual(a: number, b: number, toleranceMinor?: number): boolean;
```

Codes: `INVALID_SKU`, `INVALID_PRICE`, `INVALID_QUANTITY`.
