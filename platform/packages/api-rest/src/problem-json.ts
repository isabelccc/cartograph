/**
 * RFC 7807 Problem Details for HTTP APIs.
 *
 * Requirements:
 * - R-NF-3: stable type/code; no stack in body.
 *
 * TODO:
 * - [ ] serializeDomainError(err): ProblemDocument
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — api-rest
 */
export function toProblemJson(): never {
  throw new Error("TODO: toProblemJson — see file header JSDoc");
}

