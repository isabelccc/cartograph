# Store — region & sales channel

## TODO

- [ ] Persist `Region` / `SalesChannel` in DB; cache hot paths.
- [ ] Resolve channel from `Host` / header / cookie in BFF.
- [ ] Multi-warehouse default region per channel (future).

## Requirements

- Currency comparison for checkout is **case-insensitive**; trim user input.
- Disabled channels **must not** create carts (guard + assert variant).

## Function declarations (`modules/store/*.ts`)

```ts
// region-store.ts
function supportsCurrency(region: Region, requestedCode: string): boolean;
function assertRegionAcceptsCurrency(region: Region, requestedCode: CurrencyCode): void;
function normalizeCurrencyCode(raw: string): CurrencyCode;

// sales-channel.ts
function canOpenNewCart(channel: SalesChannel): boolean;
function assertChannelAcceptsCarts(channel: SalesChannel): void;
function defaultTaxProfileIdForChannel(channelId: string): string;
```

Implement `assert*` with `DomainError` codes: `REGION_CURRENCY_MISMATCH`, `CHANNEL_DISABLED`, `INVALID_CURRENCY_CODE`.
