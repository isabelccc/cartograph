# Search

## TODO

- [ ] Indexer worker, Meilisearch/ES mapping, facets.

## Requirements

- Normalize: trim, collapse whitespace, lowercase.
- Tokens: no empty strings after split.

## Function declarations (`modules/search/search.ts`)

```ts
function normalizeSearchQuery(q: string): string;
function tokenizeSearchQuery(normalized: string): readonly string[];
function buildPrefixClause(tokens: readonly string[]): string;
```
