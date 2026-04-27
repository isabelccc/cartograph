/**
 * Append-only admin audit trail.
 *
 * Default: no-op writer; plug storage or SIEM in production.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — observability
 */
export type AuditLog = {
  readonly append: (entry: { readonly action: string; readonly detail: Record<string, unknown> }) => void;
};

export function createAuditLog(): AuditLog {
  return {
    append() {},
  };
}
