/**
 * Drizzle repository implementing order port from packages/modules.
 */
import { eq } from "drizzle-orm";
import {
  toCustomerId,
  toOrderId,
  toProductId,
  toVariantId,
  type CustomerId,
  type Money,
  type OrderId,
} from "../../../domain-contracts/src/index.js";
import type { OrderRepositoryPort } from "../../../modules/order/order.repository.port.js";
import type { Order, OrderLine } from "../../../modules/order/order.types.js";
import type { AppDb } from "../client.js";
import { orderLines, orders } from "../schema/index.js";

function money(amountMinor: string, currency: string): Money {
  return { amountMinor: BigInt(amountMinor), currency };
}

function ensureOrderTables(db: AppDb): void {
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id text primary key,
      customer_id text,
      status text not null,
      currency text not null,
      subtotal_amount_minor text not null,
      total_amount_minor text not null,
      created_at text not null,
      updated_at text not null
    );
  `);
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS order_lines (
      id text primary key,
      order_id text not null references orders(id) on delete cascade,
      product_id text not null,
      variant_id text not null,
      title text not null,
      quantity text not null,
      unit_amount_minor text not null,
      line_total_minor text not null
    );
  `);
}

function toOrderFromRows(
  head: {
    id: string;
    customerId: string | null;
    status: string;
    currency: string;
    subtotalAmountMinor: string;
    totalAmountMinor: string;
    createdAt: string;
    updatedAt: string;
  },
  rows: {
    id: string;
    productId: string;
    variantId: string;
    title: string;
    quantity: string;
    unitAmountMinor: string;
    lineTotalMinor: string;
  }[],
): Order {
  const lines: readonly OrderLine[] = rows.map((row) => ({
    id: row.id,
    productId: toProductId(row.productId),
    variantId: toVariantId(row.variantId),
    title: row.title,
    quantity: BigInt(row.quantity),
    unitPrice: money(row.unitAmountMinor, head.currency),
    lineTotal: money(row.lineTotalMinor, head.currency),
  }));
  return {
    id: toOrderId(head.id),
    customerId: head.customerId !== null ? toCustomerId(head.customerId) : undefined,
    status: head.status === "cancelled" ? "cancelled" : "placed",
    currency: head.currency,
    subtotal: money(head.subtotalAmountMinor, head.currency),
    total: money(head.totalAmountMinor, head.currency),
    lines,
    createdAt: head.createdAt,
    updatedAt: head.updatedAt,
  };
}

export function createOrderRepository(db: AppDb): OrderRepositoryPort {
  ensureOrderTables(db);
  return {
    async getById(id: OrderId): Promise<Order | null> {
      const [head] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (head === undefined) return null;
      const lines = await db.select().from(orderLines).where(eq(orderLines.orderId, id));
      return toOrderFromRows(head, lines);
    },

    async save(order: Order): Promise<void> {
      await db.transaction(async (tx) => {
        await tx
          .insert(orders)
          .values({
            id: order.id,
            customerId: order.customerId ?? null,
            status: order.status,
            currency: order.currency,
            subtotalAmountMinor: order.subtotal.amountMinor.toString(),
            totalAmountMinor: order.total.amountMinor.toString(),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          })
          .onConflictDoUpdate({
            target: orders.id,
            set: {
              customerId: order.customerId ?? null,
              status: order.status,
              currency: order.currency,
              subtotalAmountMinor: order.subtotal.amountMinor.toString(),
              totalAmountMinor: order.total.amountMinor.toString(),
              updatedAt: order.updatedAt,
            },
          });

        await tx.delete(orderLines).where(eq(orderLines.orderId, order.id));
        for (const line of order.lines) {
          await tx.insert(orderLines).values({
            id: line.id,
            orderId: order.id,
            productId: line.productId,
            variantId: line.variantId,
            title: line.title,
            quantity: line.quantity.toString(),
            unitAmountMinor: line.unitPrice.amountMinor.toString(),
            lineTotalMinor: line.lineTotal.amountMinor.toString(),
          });
        }
      });
    },

    async listByCustomerId(customerId: CustomerId): Promise<readonly Order[]> {
      const heads = await db.select().from(orders).where(eq(orders.customerId, customerId));
      const out: Order[] = [];
      for (const head of heads) {
        const lines = await db
          .select()
          .from(orderLines)
          .where(eq(orderLines.orderId, head.id));
        out.push(toOrderFromRows(head, lines));
      }
      return out;
    },
  };
}

