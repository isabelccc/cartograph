# Events — domain workflow

## TODO

- [ ] Outbox table, consumer idempotency, dead-letter queue.
- [ ] CloudEvents envelope mapping.

## Requirements

- `isOrderPlaced` is a **type guard**; must narrow `DomainEvent` correctly.
- Redaction: never log full PII from payloads.

## Function declarations (`modules/events/workflow-events.ts`)

```ts
function isOrderPlaced(e: DomainEvent): e is OrderPlaced;
function eventSchemaVersion(e: DomainEvent): number;
function redactEventForLog(e: DomainEvent): Record<string, string>;
```
