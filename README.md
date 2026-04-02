# typescript-educative

TypeScript practice repo with two tracks:

1. **`topics/`** — small exercises and Vitest specs (`vitest.config.ts`).
2. **`modules/`** — flat domain-style CRM-style stubs (cart, catalog, checkout, …) and tests (`vitest.modules.config.ts`).

A third track is the **Series B commerce platform skeleton** under **`platform/`** (Medusa × Vendure–style layout: apps, packages, Drizzle persistence, plugins). Spec: [`docs/SERIES-B-PLATFORM.md`](docs/SERIES-B-PLATFORM.md).

## Requirements

- **Node.js** 18+ (global `crypto.randomUUID`, native deps for `better-sqlite3`)
- **npm** (or use your own package manager and equivalent commands)

## Setup

```bash
npm install
```

## Scripts

| Command | Description |
|--------|-------------|
| `npm test` | Run Vitest for `topics/` |
| `npm run test:modules` | Run Vitest for `modules/` |
| `npm run test:all` | Both suites |
| `npm run test:watch` | Watch mode (topics config) |
| `npm run db:push` | Apply Drizzle schema to SQLite (dev) under `platform/packages/persistence-drizzle/` |
| `npm run db:generate` | Generate SQL migrations from schema |
| `npm run db:studio` | Open Drizzle Studio for the local SQLite file |

## Platform & database

- **Overview:** [`platform/README.md`](platform/README.md)
- **SQLite file (after `db:push`):** `platform/packages/persistence-drizzle/data.sqlite` (gitignored recommended)
- **Schema:** `platform/packages/persistence-drizzle/src/schema/`
- **Migrations:** `platform/packages/persistence-drizzle/src/migrations/`

Typed DB handle: `AppDb` from `platform/packages/persistence-drizzle/src/client.ts` — pass it into `createCartRepository(db)`, `createCustomerRepository(db)`, etc.

## Docs

| Doc | Purpose |
|-----|---------|
| [`docs/SERIES-B-PLATFORM.md`](docs/SERIES-B-PLATFORM.md) | Platform architecture, NFRs, module checklist |
| [`docs/CRM-REQUIREMENTS.md`](docs/CRM-REQUIREMENTS.md) | CRM / modules index |
| [`platform/docs/README.md`](platform/docs/README.md) | Pointers to ADRs and runbooks |

## Typecheck

```bash
npx tsc --noEmit
```

## Layout (short)

```
topics/           # exercise topics + tests
modules/          # learning CRM-style modules + tests
platform/
  apps/           # core-api, worker, BFF stubs
  packages/       # domain-contracts, modules, persistence-drizzle, …
  plugins/        # plugin stubs
docs/             # SERIES-B, CRM requirements
```

## License

Private / educational — add a `LICENSE` if you publish.
