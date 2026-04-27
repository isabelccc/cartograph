/**
 * Drizzle repository implementing {@link PaymentRepositoryPort}.
 */
import { eq } from "drizzle-orm";
import type { OrderId, PaymentId } from "../../../domain-contracts/src/index.js";
import { toOrderId, toPaymentId } from "../../../domain-contracts/src/index.js";
import type { Money } from "../../../domain-contracts/src/money.js";
import type { PaymentRepositoryPort } from "../../../modules/payment/payment.repository.port.js";
import type { Payment, PaymentStatus } from "../../../modules/payment/payment.types.js";
import type { AppDb } from "../client.js";
import { payments } from "../schema/payments.js";

function money(amt: string, currency: string): Money {
  return { amountMinor: BigInt(amt), currency };
}

function parseMetadataJson(raw: string): Readonly<Record<string, unknown>> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return { ...(parsed as Record<string, unknown>) };
  } catch {
    return {};
  }
}

function ensurePaymentTable(db: AppDb): void {
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id text primary key,
      order_id text not null references orders(id) on delete cascade,
      status text not null,
      amount_minor text not null,
      currency text not null,
      provider_ref text,
      metadata_json text not null,
      created_at text not null,
      updated_at text not null
    );
  `);
}

function rowToPayment(row: {
  id: string;
  orderId: string;
  status: string;
  amountMinor: string;
  currency: string;
  providerRef: string | null;
  metadataJson: string;
  createdAt: string;
  updatedAt: string;
}): Payment {
  return {
    id: toPaymentId(row.id),
    orderId: toOrderId(row.orderId),
    status: row.status as PaymentStatus,
    amount: money(row.amountMinor, row.currency),
    providerRef: row.providerRef,
    metadata: parseMetadataJson(row.metadataJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createPaymentRepository(db: AppDb): PaymentRepositoryPort {
  ensurePaymentTable(db);

  return {
    async getById(id: PaymentId): Promise<Payment | null> {
      const [row] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
      return row === undefined ? null : rowToPayment(row);
    },

    async getByProviderRef(providerRef: string): Promise<Payment | null> {
      const [row] = await db
        .select()
        .from(payments)
        .where(eq(payments.providerRef, providerRef))
        .limit(1);
      return row === undefined ? null : rowToPayment(row);
    },

    async findByOrderId(orderId: OrderId): Promise<readonly Payment[]> {
      const rows = await db.select().from(payments).where(eq(payments.orderId, orderId));
      return rows.map(rowToPayment);
    },

    async findByStatus(status: PaymentStatus): Promise<readonly Payment[]> {
      const rows = await db.select().from(payments).where(eq(payments.status, status));
      return rows.map(rowToPayment);
    },

    async save(payment: Payment): Promise<void> {
      db.transaction((tx) => {
        tx.insert(payments)
          .values({
            id: payment.id,
            orderId: payment.orderId,
            status: payment.status,
            amountMinor: payment.amount.amountMinor.toString(),
            currency: payment.amount.currency,
            providerRef: payment.providerRef,
            metadataJson: JSON.stringify(payment.metadata),
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
          })
          .onConflictDoUpdate({
            target: payments.id,
            set: {
              orderId: payment.orderId,
              status: payment.status,
              amountMinor: payment.amount.amountMinor.toString(),
              currency: payment.amount.currency,
              providerRef: payment.providerRef,
              metadataJson: JSON.stringify(payment.metadata),
              updatedAt: payment.updatedAt,
            },
          })
          .run();
      });
    },
  };
}
