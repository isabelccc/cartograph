/**
 * payment — payment.types (types)
 *
 * Requirements:
 * - Provider-agnostic
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — payment
 */
import type { OrderId, PaymentId } from "../../domain-contracts/src/index.js";
import type { Money } from "../../domain-contracts/src/money.js";

export type { PaymentId };

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded"
  | "canceled";

export type Payment = {
  readonly id: PaymentId;
  readonly orderId: OrderId;
  readonly status: PaymentStatus;
  readonly amount: Money;
  readonly providerRef: string | null;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly updatedAt: string;
};
