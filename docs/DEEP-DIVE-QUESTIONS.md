# Cartograph — 100 deep-dive questions

Use these to build a mental model of the codebase. Answer each by reading code and docs (start with `docs/SERIES-B-PLATFORM.md`, `apps/core-api/src/app.ts`, `packages/modules`, `packages/persistence-drizzle`).

---

## Architecture and boundaries (1–15)

1. What is the intended split between `packages/modules` (domain) and `packages/persistence-drizzle` (adapter), and where must domain rules *not* live?
2. Why does the repo separate **Shop** vs **Admin** HTTP surfaces under `core-api`?
3. What is the **kernel / plugin** model trying to buy you (Vendure-style) vs a single Express app?
4. How would you trace a request from `apps/core-api/src/main.ts` to a domain `create*Service` call?
5. What is `AppContext` responsible for, and what must *never* be implicit globals?
6. Why is `api-rest` a separate package instead of Express utilities inside `core-api`?
7. What is the long-term job of `packages/workflows` if checkout becomes saga-based?
8. How do `events/` and `outbox` relate to at-least-once delivery, and what is not implemented yet?
9. What does “R-DOM-1: Services use ports, not Drizzle” imply when someone adds a new table?
10. When would you add a **new app** (e.g. `admin-bff`) vs a new **plugin**?
11. How does the **multi-tenant** hook `resolveTenant` intend to be used, and what is missing today?
12. What is the difference between a **port** file and a **service** file in `packages/modules`?
13. Why are ID types “branded” in `domain-contracts` instead of plain `string`?
14. What would break if you passed `AppDb` with the wrong `schema` generic to Drizzle?
15. What is the role of `packages/kernel` relative to `apps/core-api`?

---

## Domain model and invariants (16–30)

16. How does **Money** avoid floats, and where could rounding still bite you?
17. Why are cart line and order line shapes different, and when are snapshots required?
18. What invariants does `createInventoryService` enforce on reserve / commit / release?
19. How can inventory **reserved** and **onHand** get inconsistent if the DB and domain disagree?
20. What is the lifecycle of an `InventoryReservation` status, and which transitions are *not* allowed?
21. How does `PaymentStatus` map to real PSP states (authorized vs captured)?
22. When is `orderId` on a reservation `null`, and how does that interact with the DB FK?
23. How does `TaxService.estimateForCountry` differ from a real nexus/vertex tax engine?
24. What assumptions does catalog `listProducts` make about `activeOnly`?
25. How does `placeFromCart` ensure pricing consistency with catalog at order time?
26. What happens if two requests reserve the last unit concurrently? (What layer should solve it?)
27. Where is **idempotency** for payments intended to live (domain vs API vs provider)?
28. What is the purpose of `DomainError` codes vs free-form error strings?
29. How would you model partial refunds in this payment schema?
30. What would “ATP” (available-to-promise) mean in a multi-warehouse world here?

---

## Persistence and Drizzle (31–45)

31. Why does `openDrizzleSqlite` create parent directories, and when is that unsafe?
32. What is the contract of `AppDb = … & { $client }`, and who uses raw `$client.exec`?
33. Why do some repositories `CREATE TABLE IF NOT EXISTS` *and* Drizzle schema definitions exist?
34. How do migrations in `packages/persistence-drizzle/src/migrations` relate to the `IF NOT EXISTS` bootstraps?
35. What is the risk of JSON columns (`metadata_json`, `lines`) vs normalized tables?
36. How would you add an index for `payments.provider_ref` at scale?
37. What does `onConflictDoUpdate` assume about primary keys in each repository?
38. Why might SQLite FK enforcement depend on `PRAGMA foreign_keys`?
39. How does `idempotency-store` guarantee replay safety for the demo `POST /demo/commits`?
40. When should you use a transaction across multiple tables vs single-table upsert?
41. How would you represent money in SQLite without bigint columns (current approach: text)?
42. What breaks if a repository maps `bigint` incorrectly through JSON `JSON.stringify`?
43. How is `getByProviderRef` used in the Stripe flow, and could duplicates exist?
44. What migration strategy is appropriate for production given current dual paths?
45. How would you test repositories without hitting real SQLite on disk?

---

## HTTP API, versioning, and plugins (46–60)

46. How does `withApiVersion` shape real URLs (e.g. `/store/v1/...`)?
47. Why must Stripe webhooks be registered *before* `express.json` middleware?
48. How does the global `asyncHandler` interact with the error boundary in `app.ts`?
49. What is RFC 7807 doing here, and which errors are *not* `DomainError`?
50. How does the **core-defaults** plugin add routes without editing `app.ts`?
51. When would you disable `core-defaults` in production, and how (`PLUGIN_CORE_DEFAULTS_DISABLED`)?
52. What is the intended difference between `GET /ready` and `GET /health`?
53. How would you add CORS and auth middleware without tangling every route?
54. How does the admin `/status` route differ from public `/admin/.../health`?
55. What attack surface does `POST /store/.../payments` have without user auth?
56. How would you structure pagination for `listProducts`?
57. How would you add rate limits to public endpoints?
58. How does request context (`req.requestId`) flow through logging?
59. How would you add `Deprecation` / `Sunset` headers in practice?
60. What would it take to split GraphQL into `packages/api-graphql` for real?

---

## Security and compliance (61–70)

61. How should `ADMIN_API_KEY` be stored and rotated, and what leaks if it appears in logs?
62. What guarantees does Stripe webhook **signature verification** provide?
63. What happens if webhook raw body is parsed as JSON by mistake?
64. How would you prevent someone from creating a payment intent for another user’s order?
65. What PII fields exist in the schema, per comments (R-NF-6), and are they actually documented?
66. How does env validation in `env.schema.ts` differ between dev and production (`DATABASE_PATH` rule)?
67. How would you add OAuth2 / JWT to shop routes without forking the whole `app`?
68. What is a threat model for idempotent commit replay vs tampering?
69. How should secrets for Stripe be scoped (test vs live keys)?
70. What logging must never include (per R-NF-5) and is that enforced in code?

---

## Operations, worker, and reliability (71–80)

71. What is the worker’s current behavior, and what queue is implied by the docs?
72. How would you implement the **transactional outbox** pattern in this stack?
73. How should graceful shutdown work with an HTTP server + DB + background jobs?
74. How would you run migrations as a release step instead of on boot?
75. How would you observe queue depth and failures (R-NF-7)?
76. How would you implement retries with exponential backoff in workers?
77. How does SQLite file locking behave with `better-sqlite3` in multi-process deploys?
78. When would you move from SQLite to Postgres in this design?
79. How would you do blue/green deploys with plugin manifests?
80. How would you health-check the DB in `/ready` vs `/health` meaningfully?

---

## Code quality, testing, and evolution (81–90)

81. What is the purpose of `tests/contract` vs `tests/e2e` in this repo?
82. How would you write a test that the Stripe webhook updates payment state idempotently?
83. What would a minimal `createInMemoryRepositories` need to cover for `core-api`?
84. How would you use Zod to validate HTTP bodies at the edge, given domain uses branded IDs?
85. Why are many packages still `throw new Error("TODO")`—what is the dependency graph risk?
86. How would you add CI that runs `typecheck` and later tests?
87. How would you evolve `toOrderId` from unsafe casts to real validation?
88. What refactors are needed if a second payment provider (Adyen) is added?
89. How would you document API changes when `/v1` breaks?
90. How would you use feature flags (`FEATURE_CHECKOUT_V2`) safely in the domain layer?

---

## Product and “why this design” (91–100)

91. How close is this repository to a Medusa/Vendure-style **commerce kernel**?
92. What is intentionally **not** built (e.g. storefront UI) and should stay separate?
93. How would a search plugin interact with `catalog` and worker indexing?
94. How would returns and refunds be modeled on top of current order/payment types?
95. How would promotions/discounts plug in without polluting the order line schema?
96. How would you represent multi-currency carts vs single-currency orders?
97. How would subscriptions differ from this one-time payment model?
98. How would B2B pricing (net terms) complicate the current `Payment` model?
99. How would you explain this system to a new senior engineer in 10 minutes using only five files?
100. If you could only complete **one** vertical next (auth, tax provider, or payment capture) to de-risk the business, which would you pick and why?

---

## Suggested study rhythm

- Pick **one section** per day and answer **10 questions** in your own words, with file references.
- Revisit after changes: answers drift as TODOs are implemented.

Related: `docs/SERIES-B-PLATFORM.md`, `README.md` (if present).
