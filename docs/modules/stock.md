# Stock — inventory

## TODO

- [ ] Reservations with TTL + idempotency keys.
- [ ] Multi-location ATP (available-to-promise) read models.

## Requirements

- Non-negative integers; `reserveStock` throws on insufficient quantity.
- `releaseStock` must never drive totals negative.

## Function declarations (`modules/stock/inventory.ts`)

```ts
function reserveStock(stock: StockTable, variantId: string, qty: number): StockTable;
function releaseStock(stock: StockTable, variantId: string, qty: number): StockTable;
function assertNoNegativeStock(stock: StockTable): void;
function availableUnits(stock: StockTable, variantId: string): number;
```

Codes: `INSUFFICIENT_STOCK`, `INVALID_QTY`, `NEGATIVE_STOCK`.
