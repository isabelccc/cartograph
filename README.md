# Cartograph platform

TypeScript monorepo for a commerce-style **platform skeleton**: domain modules, Drizzle + SQLite persistence, BFF/API stubs, plugins, and workflows. Layout is inspired by Medusa / Vendure–style separation of apps, packages, and plugins.

## Repository layout

| Path | Purpose |
|------|---------|
| [`platform/`](platform/) | All application and library code |
| [`platform/docs/SERIES-B-PLATFORM.md`](platform/docs/SERIES-B-PLATFORM.md) | Architecture notes, NFRs, module checklist |
| [`platform/packages/persistence-drizzle/`](platform/packages/persistence-drizzle/) | Drizzle schema, migrations, SQLite dev DB |

## Requirements

- **Node.js** 18+
- **npm** (or another package manager with equivalent scripts)

## Setup

```bash
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run db:push` | Apply Drizzle schema to local SQLite under `platform/packages/persistence-drizzle/` |
| `npm run db:generate` | Generate SQL migrations from schema |
| `npm run db:studio` | Open Drizzle Studio for the SQLite file |

## Typecheck

```bash
npx tsc --noEmit
```

## License

Specify a `LICENSE` file if you open-source this project.
