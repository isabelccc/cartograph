# Auth — API keys & crypto helpers

## TODO

- [ ] JWT for customers/admin, scopes, rotation, vault storage.

## Requirements

- `pk_` / `sk_` prefix + alphanumeric body, minimum length (see tests).
- `timingSafeEqual` must be **constant-time** (no short-circuit on length mismatch in real impl).

## Function declarations (`modules/auth/auth.ts`)

```ts
type ApiKeyKind = "publishable" | "secret";

function isValidApiKey(key: string): boolean;
function classifyApiKey(key: string): ApiKeyKind | null;
function timingSafeEqual(a: string, b: string): boolean;
```
