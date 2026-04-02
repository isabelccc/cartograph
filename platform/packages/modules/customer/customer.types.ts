/**
 * customer — customer.types (types)
 *
 * Requirements:
 * - Normalized email at domain/API boundary (lowercase, trim) — enforce in service.
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-NF-6: PII fields (`email`, `name`, `shippingAddress`).
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — customer
 */
import type { CustomerId } from "../../domain-contracts/src/index.js";

export type { CustomerId };

export type Customer = {
  readonly id: CustomerId;
  readonly email: string;
  readonly name: string;
  readonly status: string;
  readonly shippingAddress: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};
