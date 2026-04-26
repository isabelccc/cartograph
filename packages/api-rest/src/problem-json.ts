/**
 * RFC 7807 Problem Details for HTTP APIs.
 *
 * Requirements:
 * - R-NF-3: stable type/code; no stack in body.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — api-rest
 */
import { DomainError } from "../../domain-contracts/src/errors.js";

export type ProblemDocument = {
  type: string;
  title: string;
  status: number;
  detail: string;
  /** Stable machine-readable code (extension). */
  code?: string;
};

const DEFAULT_TYPE = "about:blank";

/** Heuristic HTTP status from stable domain codes (extend as codes grow). */
export function statusForDomainCode(code: string): number {
  if (code.endsWith("_NOT_FOUND")) return 404;
  if (code.endsWith("_UNAVAILABLE")) return 503;
  if (code.endsWith("_CONFLICT") || code.includes("_CONFLICT_")) return 409;
  if (code.includes("FORBIDDEN") || code.includes("NOT_ALLOWED")) return 403;
  if (code.includes("UNAUTHORIZED") || code.includes("UNAUTHENTICATED")) return 401;
  if (
    code.endsWith("_INVALID") ||
    code.endsWith("_REQUIRED") ||
    code.includes("_DISABLED")
  ) {
    return 400;
  }
  return 400;
}

export function problemFromDomainError(err: DomainError): ProblemDocument {
  const status = statusForDomainCode(err.code);
  return {
    type: DEFAULT_TYPE,
    title: err.code,
    status,
    detail: err.message,
    code: err.code,
  };
}

export function problemInternalServerError(): ProblemDocument {
  return {
    type: DEFAULT_TYPE,
    title: "Internal Server Error",
    status: 500,
    detail: "An unexpected error occurred.",
  };
}
