/**
 * DomainError + stable machine-readable codes.
 *
 * Requirements:
 * - R-NF-3: Map to HTTP in API layer; codes stable across releases.
 *
 * TODO:
 * - [ ] Base class + catalog of codes.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — domain-contracts
 */
export class DomainError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

