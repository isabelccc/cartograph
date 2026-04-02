# Shared types (`modules/types/`)

## TODO

- [ ] Branded IDs (`OrderId`, `CustomerId`) to avoid argument swap bugs.
- [ ] Zod/Valibot schemas mirroring DTOs for HTTP ingress.

## Exports (see `index.ts`)

- `DomainError`, `Result`, `ok`, `err`, `CurrencyCode`
- `CheckoutContext`, `CheckoutValidationInput`
- Domain DTOs: `Region`, `SalesChannel`, `Customer`, `Cart`, `PayableOrder`, …

## `DomainError` shape

```ts
class DomainError extends Error {
  readonly code: string;
  readonly details?: Readonly<Record<string, string>>;
}
```

Use stable `code` values documented in each domain `.md` file.
