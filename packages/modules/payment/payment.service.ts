/**
 * payment — payment.service (service)
 *
 * Persists payment rows; card networks / PSPs plug in later via `PaymentProviderPort`.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — payment
 */
import type { OrderId, PaymentId } from "../../domain-contracts/src/index.js";
import type { PaymentRepositoryPort } from "./payment.repository.port.js";
import type { Payment, PaymentStatus } from "./payment.types.js";

export type PaymentServiceDeps = {
  readonly paymentRepo: PaymentRepositoryPort;
};

export interface PaymentService {
  getById(id: PaymentId): Promise<Payment | null>;
  getByProviderRef(providerRef: string): Promise<Payment | null>;
  findByOrderId(orderId: OrderId): Promise<readonly Payment[]>;
  findByStatus(status: PaymentStatus): Promise<readonly Payment[]>;
  save(payment: Payment): Promise<Payment>;
}

export function createPaymentService(deps: PaymentServiceDeps): PaymentService {
  return {
    getById: (id) => deps.paymentRepo.getById(id),
    getByProviderRef: (ref) => deps.paymentRepo.getByProviderRef(ref),
    findByOrderId: (orderId) => deps.paymentRepo.findByOrderId(orderId),
    findByStatus: (status) => deps.paymentRepo.findByStatus(status),
    async save(payment) {
      await deps.paymentRepo.save(payment);
      return payment;
    },
  };
}
