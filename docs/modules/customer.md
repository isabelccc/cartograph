# Customer

## TODO

- [ ] Addresses, default shipping, tax IDs.
- [ ] Customer groups & B2B company linkage.
- [ ] Auth: magic link / OAuth (outside this package).

## Requirements

- Email: trim + lowercase; reject empty after normalization.
- `tryParseEmail` returns `Result` — no throw for validation failures.

## Function declarations (`modules/customer/customer.ts`)

```ts
function normalizeEmail(raw: string): string;
function createCustomer(input: CreateCustomerInput): Customer;
function tryParseEmail(raw: string): Result<string, DomainError>;
function emailsEqual(a: string, b: string): boolean;
```

Suggested `DomainError` codes: `INVALID_EMAIL`, `EMAIL_REQUIRED`.
