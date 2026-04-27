/**
 * Drizzle repository: fulfillments.
 */
import { eq } from "drizzle-orm";
import {
  toFullfillmentId,
  toOrderId,
  toVariantId,
  type FulfillmentId,
} from "../../../domain-contracts/src/index.js";
import type { FulfillmentRepoPort } from "../../../modules/fulfillment/fulfillment.repository.port.js";
import type {
  Fulfillment,
  FulfillmentLine,
} from "../../../modules/fulfillment/fulfillment.types.js";
import type { OrderId } from "../../../modules/order/order.types.js";
import type { AppDb } from "../client.js";
import { fulfillments } from "../schema/index.js";

type LineJson = { variantId: string; quantity: string };

function ensureFulfillmentTable(db: AppDb): void {
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS fulfillments (
      id text primary key,
      order_id text not null references orders(id) on delete cascade,
      lines text not null,
      status text not null,
      carrier text,
      trackingNumber text,
      trackingUrl text,
      external_shipment_id text,
      shippedAt text,
      deliveredAt text,
      created_at text not null,
      updated_at text not null
    );
  `);
}

function rowToFulfillment(row: {
  id: string;
  orderId: string;
  lines: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  externalShipmentId: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}): Fulfillment {
  const parsed = JSON.parse(row.lines) as LineJson[];
  const lines: readonly FulfillmentLine[] = parsed.map((l) => ({
    variantId: toVariantId(l.variantId),
    quantity: BigInt(l.quantity),
  }));
  return {
    id: toFullfillmentId(row.id),
    orderId: toOrderId(row.orderId),
    lines,
    status: row.status as Fulfillment["status"],
    carrier: row.carrier,
    trackingNumber: row.trackingNumber,
    trackingUrl: row.trackingUrl,
    externalShipmentId: row.externalShipmentId,
    shippedAt: row.shippedAt,
    deliveredAt: row.deliveredAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createFulfillmentRepository(db: AppDb): FulfillmentRepoPort {
  ensureFulfillmentTable(db);
  return {
    async getById(id: FulfillmentId): Promise<Fulfillment | null> {
      const [row] = await db.select().from(fulfillments).where(eq(fulfillments.id, id)).limit(1);
      return row === undefined ? null : rowToFulfillment(row);
    },

    async listByOrderId(orderId: OrderId): Promise<readonly Fulfillment[]> {
      const rows = await db.select().from(fulfillments).where(eq(fulfillments.orderId, orderId));
      return rows.map(rowToFulfillment);
    },

    async save(f: Fulfillment): Promise<void> {
      const linesJson = JSON.stringify(
        f.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity.toString() })),
      );
      await db
        .insert(fulfillments)
        .values({
          id: f.id,
          orderId: f.orderId,
          lines: linesJson,
          status: f.status,
          carrier: f.carrier,
          trackingNumber: f.trackingNumber,
          trackingUrl: f.trackingUrl,
          externalShipmentId: f.externalShipmentId,
          shippedAt: f.shippedAt,
          deliveredAt: f.deliveredAt,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
        })
        .onConflictDoUpdate({
          target: fulfillments.id,
          set: {
            orderId: f.orderId,
            lines: linesJson,
            status: f.status,
            carrier: f.carrier,
            trackingNumber: f.trackingNumber,
            trackingUrl: f.trackingUrl,
            externalShipmentId: f.externalShipmentId,
            shippedAt: f.shippedAt,
            deliveredAt: f.deliveredAt,
            updatedAt: f.updatedAt,
          },
        });
    },
  };
}
