/**
 * Resolver → service mapping context (skeleton).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — api-graphql
 */
export type GraphQLResolverContext = {
  /** Populated by the GraphQL host when that surface is built out. */
  readonly services: Record<string, unknown>;
};
