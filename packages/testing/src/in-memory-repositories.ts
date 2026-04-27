/**
 * In-memory fake repository implementations (placeholder map).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Tests
 */
export function createInMemoryRepositories(): {
  readonly stores: Map<string, Map<string, unknown>>;
} {
  return { stores: new Map() };
}
