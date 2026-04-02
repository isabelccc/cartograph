/**
 * Money: integer minor units invariants.
 *
 * Requirements:
 * - R-DOM-2: No float money in domain; conversion at API edge only.
 *
 * TODO (this file):
 * - [x] `add`, integer-only scaling (no `number` multiplier).
 * - [ ] Choose and document rounding for `scaleRational` (currently truncates toward zero).
 * - [ ] Optional: `subtract`, `min`, `max`, `isZero`, `compare`.
 * - [ ] API edge: parse/format decimal strings ↔ minor units using a fixed ISO-4217 minor map.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — domain-contracts
 */
import { DomainError } from "./errors.js";

export type Money = { readonly amountMinor: bigint; readonly currency: string };

export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new DomainError(
      "MONEY_CURRENCY_MISMATCH",
      `Expected currency ${a.currency}, got ${b.currency}`,
    );
  }
}

/** Throws if `value === 0n` (e.g. use before dividing by `value`). */
export function assertBigIntNonZero(label: string, value: bigint): void {
  if (value === 0n) {
    throw new DomainError(
      "MONEY_DIVISION_BY_ZERO",
      `${label} must be non-zero`,
    );
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return {
    amountMinor: a.amountMinor + b.amountMinor,
    currency: a.currency,
  };
}

/**
 * Whole-unit multiple (e.g. line total = unit price × quantity).
 * Uses bigint only — no floating-point.
 */
export function timesIntegerAmount(amount: Money, quantity: bigint): Money {
  if (quantity < 0n) {
    throw new DomainError(
      "MONEY_NEGATIVE_QUANTITY",
      "timesIntegerAmount: quantity must be >= 0",
    );
  }
  return {
    amountMinor: amount.amountMinor * quantity,
    currency: amount.currency,
  };
}

/**
 * Scale by a rational factor: result = trunc((amountMinor * numerator) / denominator)
 * (bigint `/` truncates toward zero — see TODO for other rounding modes).
 *
 * Examples:
 * - 10% of amount: numerator = 10, denominator = 100
 * - 825 bps: numerator = 825, denominator = 10000
 *
 * Do not use `Math.round` here: `amountMinor` is bigint; mixing with `number` breaks R-DOM-2
 * and can lose precision for large amounts.
 */
export function scaleRational(
  amount: Money,
  numerator: bigint,
  denominator: bigint,
): Money {
  assertBigIntNonZero("denominator", denominator);
  return {
    amountMinor: (amount.amountMinor * numerator) / denominator,
    currency: amount.currency,
  };
}
