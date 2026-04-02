# Platform

Commerce-style **platform skeleton** (Medusa × Vendure–inspired): apps that boot HTTP and workers, **packages** for domain logic and persistence, **plugins** for swappable integrations, plus infra and test stubs. This tree is the main codebase; the repo root only wires tooling (TypeScript, Drizzle CLI).

---

## How to work here

1. **Read the spec** — Architecture, NFRs, and module checklist: [`docs/SERIES-B-PLATFORM.md`](docs/SERIES-B-PLATFORM.md).
2. **Implement from file headers** — Most `.ts` and `.graphql` files start with **Requirements** and **TODO** blocks in JSDoc or `#` comments; treat those as the contract for that file.
3. **Keep domains pure** — Under `packages/modules/*`, services depend on **ports** (interfaces), not Drizzle or HTTP. Wire concrete repositories and DB in apps or a composition root.

---

## Layout

| Area | Role |
|------|------|
| [`apps/`](apps/) | Runtimes: `core-api`, `worker`, BFF stubs (`admin-bff`, `storefront-bff`). Bootstrap, HTTP, background processors. |
| [`packages/kernel/`](packages/kernel/) | Plugin-oriented kernel: lifecycle, DI-style composition (stubs). |
| [`packages/domain-contracts/`](packages/domain-contracts/) | Shared types only: branded ids, `Money`, `DomainError`, pagination (no I/O). |
| [`packages/modules/`](packages/modules/) | Domain modules: cart, catalog, customer, order, payment, fulfillment, … — types, services, repository **ports**. |
| [`packages/persistence-drizzle/`](packages/persistence-drizzle/) | Drizzle schemas, migrations, SQLite dev DB, repository implementations. |
| [`packages/api-graphql/`](packages/api-graphql/) · [`packages/api-rest/`](packages/api-rest/) | API shapes and shared HTTP helpers (stubs). |
| [`packages/events/`](packages/events/) · [`packages/workflows/`](packages/workflows/) | Domain events, outbox, workflow sketches. |
| [`packages/authz/`](packages/authz/) · [`packages/observability/`](packages/observability/) · [`packages/testing/`](packages/testing/) | Cross-cutting stubs. |
| [`plugins/`](plugins/) | Example plugins (payment, shipping, search) with `plugin.json` metadata. |
| [`infra/`](infra/) | Docker Compose, K8s notes. |
| [`docs/`](docs/) | Spec + [`ADR`](docs/adr/) + [`runbooks`](docs/runbooks/) — see [`docs/README.md`](docs/README.md). |
| [`tests/`](tests/) | E2E / contract placeholders. |

---

## Database (from repo root)

Scripts live in the **parent** `package.json`:

```bash
npm run db:push      # apply schema to local SQLite
npm run db:generate  # migrations from schema
npm run db:studio    # Drizzle Studio
```

SQLite files are under `packages/persistence-drizzle/` and are gitignored.

---

## Typecheck

From the **repository root** (parent of `platform/`):

```bash
npx tsc --noEmit
```

---

## Further reading

| Doc | Contents |
|-----|----------|
| [`docs/SERIES-B-PLATFORM.md`](docs/SERIES-B-PLATFORM.md) | Full platform design, layout detail, NFRs |
| [`docs/README.md`](docs/README.md) | ADRs and runbook index |
