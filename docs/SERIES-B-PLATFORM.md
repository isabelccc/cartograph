# Medusa × Vendure hybrid (spec only)


---

## Design principles

| From Medusa | From Vendure | Series B addition |
|-------------|--------------|-------------------|
| Module boundaries, **workflows** / steps | **Plugin host**, `onBootstrap`, API extension merge | **Outbox**, idempotency, **feature flags**, SLO-oriented logging |
| Cart → order → payment **pipelines** | Injectable **strategies** (tax, shipping, payment) | **Admin vs storefront** API separation, **tenant-ready** config shape |

---

## Repository layout (recommended monorepo root: `platform/`)

Create this tree under your repo root (or rename `platform/` → `apps/` + `packages/` only — keep paths consistent).

```
platform/
  README.md                          # links to this doc + local runbook

  apps/
    core-api/
      package.json
      tsconfig.json
      src/
        main.ts                      # TODO: HTTP server bootstrap
        app.ts                       # TODO: compose plugins + mount routers
        config/
          env.schema.ts              # TODO: zod/env validation
          feature-flags.ts           # TODO: LaunchDarkly/Unleash or static map
          logger.ts                  # TODO: pino/winston + trace id
        http/
          server.ts                  # TODO: fastify or express + graceful shutdown
          versioning.ts              # TODO: /v1, deprecations
        plugins.manifest.ts          # TODO: register core + community plugins

    worker/
      package.json
      tsconfig.json
      src/
        main.ts                      # TODO: bullmq/pg-boss consumer entry
        processors/
          outbox-dispatch.ts         # TODO: relay domain events → webhooks/search
          payment-capture.ts         # TODO: async capture / reconcile
          inventory-reservation-ttl.ts # TODO: release stale holds
          search-index.ts            # TODO: Meilisearch/ES bulk

    storefront-bff/                  # optional: thin BFF for Next.js
      src/
        main.ts
        routes/

    admin-bff/                       # optional: admin UI backend-for-frontend
      src/
        main.ts

  packages/
    kernel/                            # Vendure-like runtime
      src/
        index.ts
        commerce-kernel.ts             # TODO: plugin registry, lifecycle, config merge
        plugin.types.ts                # declarations: CommercePlugin, ApiExtensionContribution
        di-container.ts                # TODO: minimal DI or explicit factory graph
        bootstrap.ts                   # TODO: ordered init: config → db → plugins → http

    domain-contracts/                  # shared types only (no IO)
      src/
        index.ts
        ids.ts                         # TODO: branded OrderId, CustomerId, …
        money.ts                       # TODO: minor units invariants
        errors.ts                      # TODO: DomainError + stable codes
        pagination.ts                  # TODO: cursor + limit DTOs

    modules/                           # Medusa-like domain modules (pure + ports)
      cart/
        cart.types.ts
        cart.service.ts                # TODO: addLine, merge guest, expire
        cart.repository.port.ts        # TODO: interface only
        cart.errors.ts
      catalog/
        product.types.ts
        variant.types.ts
        catalog.service.ts
        catalog.repository.port.ts
      customer/
        customer.types.ts
        customer.service.ts
        customer.repository.port.ts
      inventory/
        inventory.types.ts
        inventory.service.ts           # TODO: ATP, reservation, adjustments
        inventory.repository.port.ts
      order/
        order.types.ts
        order.state-machine.ts         # TODO: explicit transitions + invariants
        order.service.ts
        order.repository.port.ts
      payment/
        payment.types.ts
        payment.service.ts             # TODO: authorize/capture/refund orchestration
        payment.provider.port.ts       # TODO: Stripe/Adyen adapter interface
      fulfillment/
        fulfillment.types.ts
        fulfillment.service.ts
        fulfillment.carrier.port.ts
      promotion/
        promotion.types.ts
        promotion.service.ts
        promotion.engine.port.ts
      tax/
        tax.types.ts
        tax.service.ts
        tax.provider.port.ts
      notification/
        notification.types.ts
        notification.service.ts
        notification.channel.port.ts

    workflows/                         # Medusa-style orchestration (sagas)
      src/
        index.ts
        checkout.workflow.ts           # TODO: steps: validate → reserve → payment session → order
        order-placed.workflow.ts       # TODO: inventory commit, emails, search
        return.workflow.ts
        workflow.types.ts              # TODO: StepResult, compensation hooks
        workflow.store.port.ts         # TODO: durable step state (DB)

    events/
      src/
        index.ts
        domain-events.ts               # declarations: OrderPlaced, PaymentCaptured, …
        outbox.publisher.ts            # TODO: transactional outbox write
        outbox.relay.ts                # TODO: worker reads + delivers
        event-envelope.ts              # TODO: version, tenantId, correlationId

    api-graphql/                       # optional: single schema merge point
      src/
        schema/
          shop.graphql                 # TODO: stitched fragments
          admin.graphql
        resolvers.port.ts              # TODO: resolver → service mapping only

    api-rest/                          # optional: REST alongside GraphQL
      src/
        routes.manifest.ts
        problem-json.ts                # TODO: RFC 7807 errors

    persistence-drizzle/               # adapter: implements *.repository.port.ts
      src/
        client.ts                      # TODO: pool, migrations runner
        schema/
          index.ts
          tenants.ts                   # TODO: if multi-tenant row-level
          users.ts
          customers.ts
          products.ts
          variants.ts
          inventory.ts
          carts.ts
          cart_lines.ts
          orders.ts
          order_lines.ts
          payments.ts
          fulfillments.ts
          promotions.ts
          tax_rates.ts
          outbox.ts
        repositories/
          cart.repository.ts
          order.repository.ts
          customer.repository.ts
          inventory.repository.ts
          payment.repository.ts
        migrations/                    # drizzle-kit output

    authz/
      src/
        rbac.types.ts
        policies.ts                    # TODO: admin vs customer scopes
        authorize.ts                   # TODO: casl or custom

    observability/
      src/
        metrics.ts                     # TODO: prometheus counters/histograms
        tracing.ts                     # TODO: OTEL spans around workflows
        audit-log.ts                   # TODO: append-only admin audit trail

    testing/
      src/
        factories.ts                   # TODO: test data builders
        in-memory-repositories.ts      # TODO: fake ports for unit tests

  plugins/                             # Vendure-style installable units
    core-defaults/
      plugin.json                      # name, version, contributes: { services, routes, workflows }
      src/
        index.ts                       # TODO: register default tax/shipping stubs
    payment-stripe/
      plugin.json
      src/
        index.ts
        stripe.provider.ts             # implements payment.provider.port.ts
    shipping-flat-rate/
      plugin.json
      src/
        index.ts
    search-meilisearch/
      plugin.json
      src/
        index.ts

  infra/
    docker-compose.yml                 # TODO: postgres, redis, meilisearch
    k8s/                               # optional Series B+
      README.md

  docs/
    README.md                          # links to repo-root docs/SERIES-B-PLATFORM.md (canonical spec)
    adr/
      001-plugin-vs-module.md
      002-outbox-and-idempotency.md
    runbooks/
      payment-incident.md
      inventory-reconciliation.md

  tests/
    contract/
      storefront-api.contract.ts         # TODO: schemathesis / openapi diff
    e2e/
      checkout.happy.spec.ts
```

**Approximate file count (skeleton):** ~**120–160** files if you create every port + app entry + one plugin; adjust by dropping GraphQL or BFFs.

---

## Global requirements (non-functional)

- [ ] **R-NF-1** — Every mutating HTTP handler accepts **Idempotency-Key** where duplicates are possible (checkout, payment).
- [ ] **R-NF-2** — **Structured logs** with `requestId`, `tenantId` (nullable), `workflowId`, `orderId` when known.
- [ ] **R-NF-3** — **Domain errors** never leak stack traces to clients; map to stable `code` + HTTP status.
- [ ] **R-NF-4** — **Migrations** are forward-only in prod; feature flags gate risky flows.
- [ ] **R-NF-5** — **Secrets** only from env/secret manager; no keys in plugins committed to git.
- [ ] **R-NF-6** — **PII** fields documented; encryption at rest for columns if required by policy.
- [ ] **R-NF-7** — **Worker** jobs retry with backoff; dead-letter queue + alert.

---

## Kernel (`packages/kernel`) — TODO

- [ ] Define `CommercePlugin` interface: `name`, `version`, `configure(ctx)`, optional `shopApiExtensions`, `adminApiExtensions`, `registerServices`, `registerWorkflows`.
- [ ] Implement ordered **bootstrap**: load config → connect DB → run migrations → register plugins → start HTTP.
- [ ] **Config merge** with last-wins or explicit precedence (document in ADR).
- [ ] Expose **health** endpoints: liveness vs readiness (DB + redis).

---

## Domain modules (`packages/modules/*`) — shared requirements

- [ ] **R-DOM-1** — Services depend on **ports** (interfaces), not Drizzle directly.
- [ ] **R-DOM-2** — **Money** in integer minor units end-to-end; conversion only at API edge.
- [ ] **R-DOM-3** — **State machines** (order, payment, fulfillment) centralized; illegal transitions throw typed errors.

### Per-module TODO (minimal)

| Module | TODO |
|--------|------|
| **cart** | Guest merge; line merge rules; TTL expiry job hook; channel-scoped cart |
| **catalog** | Publish/draft; variant options; price lists per channel/region |
| **customer** | Normalized email; addresses; customer groups |
| **inventory** | Reservation with TTL; ATP; negative stock guard |
| **order** | Snapshots at submit; amendment rules; cancel vs refund semantics |
| **payment** | Provider abstraction; partial capture; refund idempotency |
| **fulfillment** | Split shipments; tracking; carrier adapter |
| **promotion** | Stack rules; coupon limits; schedule windows |
| **tax** | Nexus-ready provider hook; line allocation |
| **notification** | Template layers; locale; async send via worker |

---

## Workflows (`packages/workflows`) — TODO

- [ ] Model **checkout** as explicit steps with **compensation** (release inventory, void payment intent).
- [ ] Persist **workflow instance** state for long-running flows (3DS, async capture).
- [ ] Emit **domain events** only after successful transaction commit (outbox).

---

## Events & outbox (`packages/events`) — TODO

- [ ] **Transactional outbox** table in same DB as orders.
- [ ] **Envelope** includes `eventVersion`, `aggregateType`, `aggregateId`, `occurredAt`, `payload`.
- [ ] **Consumer** idempotency via `processed_events` or unique `(consumer, eventId)`.

---

## Persistence (`packages/persistence-drizzle`) — TODO

- [ ] Single **Drizzle** client; connection pool config per env.
- [ ] **Repositories** implement ports from `modules/*`; no business rules in SQL layer.
- [ ] **Indexes** for hot paths: `orders.user_id`, `payments.order_id`, `outbox.published_at`.

---

## Plugins (`plugins/*`) — TODO

- [ ] `plugin.json` schema: `name`, `version`, `main`, `contributes`.
- [ ] **Payment plugin** implements `payment.provider.port.ts` only; no direct order mutations.
- [ ] **Search plugin** subscribes to catalog events in worker.

---

## Apps — TODO

| App | TODO |
|-----|------|
| **core-api** | Public + admin route separation; rate limit; CORS; body size limits |
| **worker** | Concurrency; poison pill handling; metrics per queue |
| **storefront-bff** | Optional: aggregate calls; cache product lists |
| **admin-bff** | Optional: heavy reports async |

---

## Tests (`platform/tests`) — TODO

- [ ] **Unit**: domain services with in-memory fakes.
- [ ] **Contract**: OpenAPI/GraphQL schema vs implementation.
- [ ] **E2E**: single happy-path checkout against docker-compose stack.

---

## Relation to existing folders in this repo

- `modules/` (flat CRM exercises) — keep as **TypeScript learning** track; **do not** merge blindly into `platform/` until you port types.
- **Spec file location:** canonical copy is **`docs/SERIES-B-PLATFORM.md`** (this file). Under `platform/docs/`, use **`README.md`** as the pointer; do not duplicate the full spec unless you intentionally sync two copies.

---

## Your next steps

1. `mkdir -p platform/...` following the tree (or generate with a script).
2. Each `.ts` file: **types + `throw new Error("TODO: …")` or empty `export {}` with JSDoc `@see` to this doc section.
3. Implement **ports first**, then **Drizzle repositories**, then **workflows**, then **HTTP**.

When this structure is stable, add **ADR-003: why Drizzle** and pin **Node + pnpm** versions in root `package.json`.
