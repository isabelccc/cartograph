# Minimal MVP (local)

End-to-end path: SQLite schema, demo catalog + inventory + tax, `core-api` on port 3000, optional CORS and shop key, smoke check.

## Prerequisites

- Node 18+ (global `fetch` for smoke script)
- From repo root: `npm ci`

## Database

1. Create / update the SQLite file (default: `packages/persistence-drizzle/data.sqlite`):

   ```bash
   npm run db:push
   ```

2. Seed one demo product, variant, stock, and a US tax rate (idempotent):

   ```bash
   npm run db:seed
   ```

   Override path with `DATABASE_PATH=/absolute/path/to/db.sqlite` if needed.

## Environment (`apps/core-api`)

| Variable | Purpose |
| -------- | ------- |
| `PORT` | HTTP port (default `3000`) |
| `DATABASE_PATH` | SQLite file (default under `persistence-drizzle`) |
| `ADMIN_API_KEY` | If set, required for `GET /status` and admin routes (`X-Admin-Key` or `Authorization: Bearer`) |
| `SHOP_API_KEY` | If set, shop **mutations** (non-GET) require `X-Shop-Key` or `Authorization: Bearer` with this value; omit for open local dev |
| `CORS_ORIGIN` | e.g. `http://localhost:3001` — enables CORS for that origin (preflight + headers) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Optional: payment intent and webhook (see `apps/core-api` Stripe routes) |

## Run API

```bash
npm run dev:api
```

Check readiness: `GET http://127.0.0.1:3000/ready` → 200.

## Smoke test

With the API running:

```bash
SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke
```

If `SHOP_API_KEY` is set on the server, pass the same value:

```bash
SMOKE_SHOP_KEY=your-key SMOKE_BASE_URL=http://127.0.0.1:3000 npm run smoke
```

## Try the demo catalog

```bash
curl -sS "http://127.0.0.1:3000/store/v1/catalog/products?activeOnly=true"
```

Demo IDs after seed: product `prod_mvp_demo`, variant `var_mvp_demo`, SKU `SKU-MVP-001`.

## CI

`.github/workflows/ci.yml` runs `npm ci` and `npm run typecheck` on push and pull requests.
