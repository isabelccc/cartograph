/**
 * Envelope: eventVersion, aggregateType, aggregateId, …
 *
 * Requirements:
 * - R-NF consumer idempotency
 *
 * TODO:
 * - [ ] CorrelationId, tenantId, occurredAt
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Events & outbox
 */
export type EventEnvelope = {
  readonly eventVersion: number;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly occurredAt: string;
  readonly payload: unknown;
};

