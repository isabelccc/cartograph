/**
 * Resolver → service mapping ports (no resolver logic in persistence).
 *
 * Requirements:
 * - Thin resolvers: validate input → call service → map output.
 *
 * TODO:
 * - [ ] Define factory or context interface for GraphQL.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — api-graphql
 */
export interface GraphQLResolverContext {
  // TODO: services
}

