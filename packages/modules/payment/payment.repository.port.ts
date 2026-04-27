/**
 * payment — payment.repository.port (port)
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — payment
 */
import type { OrderId, PaymentId } from "../../domain-contracts/src/index.js";
import type { Payment, PaymentStatus } from "./payment.types.js";

export interface PaymentRepositoryPort {
  getById(id: PaymentId): Promise<Payment | null>;
  /** Lookup by PSP reference (e.g. Stripe PaymentIntent id `pi_…`). */
  getByProviderRef(providerRef: string): Promise<Payment | null>;
  findByOrderId(orderId: OrderId): Promise<readonly Payment[]>;
  findByStatus(status: PaymentStatus): Promise<readonly Payment[]>;
  save(payment: Payment): Promise<void>;
}
