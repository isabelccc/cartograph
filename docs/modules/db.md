# DB — persistence boundary

## TODO

- [ ] Prisma / Drizzle / Kysely adapter implementing `ByIdRepository`.
- [ ] Migrations, read replicas, optimistic locking (`version` column).

## Requirements

- **No business rules** in this layer — only IO + transactions.
- Cursors are **opaque** to clients; encode structured payload server-side.

## Function declarations (`modules/db/index.ts`)

```ts
interface ByIdRepository<T extends { id: string }> {
  findById(id: string): Promise<T | undefined>;
  save(entity: T): Promise<void>;
}

interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor?: string;
}

async function notImplementedAsync<T>(): Promise<T>;
async function withTransaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T>;
function encodeCursor(payload: Record<string, string>): string;
function decodeCursor(cursor: string): Record<string, string>;
```
