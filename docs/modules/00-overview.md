# Commerce modules — production-style track

Medusa-inspired **headless commerce** boundaries. Code under `modules/` is **API + types only**: every runtime function body throws `NotImplemented: …` until you implement it.

## How to work

1. Read the **domain doc** in this folder (`store.md`, `order.md`, …) for requirements, **TODO**, and **function declarations**.
2. Open the matching files under `modules/<domain>/` and replace `throw new Error("NotImplemented: …")` with real logic.
3. Run **`npm run test:modules`** (or **`npm run test:all`**) to execute Vitest against `modules/**/*.test.ts`.
4. Default **`npm test`** runs **topics only** so the TypeScript course stays green while modules are unfinished.

## Shared types

- `modules/types/` — DTOs, unions, `DomainError`, `Result`, checkout context.
- Barrel: `modules/types/index.ts`.

## Error handling convention

- Use `DomainError` + stable `code` strings for invariants callers can branch on.
- HTTP / GraphQL layers map `DomainError.code` → status + localized message.

## Suggested implementation order

`store` → `customer` → `catalog` + `stock` → `cart` → `checkout` → `order` → `billing` → `notification` → `assets` → `auth` → `search` → `events` → `db`.
