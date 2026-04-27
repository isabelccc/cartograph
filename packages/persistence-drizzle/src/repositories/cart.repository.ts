/**
 * Drizzle repository implementing cart port from `packages/modules/cart`.
 *
 * Requirements:
 * - R-DOM-1: No domain rules here — only map rows ↔ `Cart` / `CartLine` and run SQL.
 * - `save` uses a **transaction**: cart header upsert + replace all lines for that cart id.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Persistence
 */
import { eq } from "drizzle-orm";
import type { CustomerId } from "../../../domain-contracts/src/index.js";
import {
  toCartId,
  toCartLineId,
  toCustomerId,
  toProductId,
  toSessionId,
  toVariantId,
} from "../../../domain-contracts/src/index.js";
import type { CartRepositoryPort } from "../../../modules/cart/cart.repository.port.js";
import type { Cart, CartId, CartLine } from "../../../modules/cart/cart.types.js";
import type { AppDb } from "../client.js";
import { cartLines, carts } from "../schema/index.js";

/** Map DB header + line rows → domain `Cart` (shared by getById / find*). */
function toCartFromDb(
  head: {
    id: string;
    sessionId: string;
    customerId: string | null;
    currency: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  },
  lineRows: {
    id: string;
    productId: string;
    variantId: string;
    title: string;
    quantity: string;
    unitAmountMinor: string;
    lineTotalMinor: string;
  }[],
): Cart {
  const currency = head.currency;
  const lines: readonly CartLine[] = lineRows.map(
    (row): CartLine => ({
      cartLineId: toCartLineId(row.id),
      productId: toProductId(row.productId),
      variantId: toVariantId(row.variantId),
      title: row.title,
      quantity: BigInt(row.quantity),
      unitPrice: {
        amountMinor: BigInt(row.unitAmountMinor),
        currency,
      },
      lineTotal: {
        amountMinor: BigInt(row.lineTotalMinor),
        currency,
      },
    }),
  );

  return {
    id: toCartId(head.id),
    customerId:
      head.customerId !== null && head.customerId !== undefined
        ? toCustomerId(head.customerId)
        : undefined,
    sessionId: toSessionId(head.sessionId),
    currency,
    status: head.status,
    createdAt: head.createdAt,
    updatedAt: head.updatedAt,
    lines,
  };
}

export function createCartRepository(db: AppDb): CartRepositoryPort {
  return {
    async getById(id: CartId): Promise<Cart | null> {
      const [head] = await db.select().from(carts).where(eq(carts.id, id)).limit(1);
      if (head === undefined) {
        return null;
      }
      const lineRows = await db
        .select()
        .from(cartLines)
        .where(eq(cartLines.cartId, id));
      return toCartFromDb(head, lineRows);
    },

    /**
     * Persists the **whole aggregate** the port promises:
     * 1. Upsert `carts` row (by `cart.id`).
     * 2. Delete existing `cart_lines` for that cart.
     * 3. Insert current `cart.lines`.
     *
     * Domain service must build a consistent `Cart` (e.g. same currency on lines as header).
     */
    async save(cart: Cart): Promise<void> {
      db.transaction((tx) => {
        tx.insert(carts)
          .values({
            id: cart.id,
            sessionId: cart.sessionId,
            customerId: cart.customerId ?? null,
            currency: cart.currency,
            status: cart.status,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt,
          })
          .onConflictDoUpdate({
            target: carts.id,
            set: {
              sessionId: cart.sessionId,
              customerId: cart.customerId ?? null,
              currency: cart.currency,
              status: cart.status,
              updatedAt: cart.updatedAt,
            },
          })
          .run();

        tx.delete(cartLines).where(eq(cartLines.cartId, cart.id)).run();

        for (const line of cart.lines) {
          tx.insert(cartLines)
            .values({
              id: line.cartLineId,
              cartId: cart.id,
              productId: line.productId,
              variantId: line.variantId,
              title: line.title,
              quantity: line.quantity.toString(),
              unitAmountMinor: line.unitPrice.amountMinor.toString(),
              lineTotalMinor: line.lineTotal.amountMinor.toString(),
            })
            .run();
        }
      });
    },

    async findBySessionId(sessionId: string): Promise<Cart | null> {
      const [head] = await db
        .select()
        .from(carts)
        .where(eq(carts.sessionId, sessionId))
        .limit(1);
      if (head === undefined) {
        return null;
      }
      const lineRows = await db
        .select()
        .from(cartLines)
        .where(eq(cartLines.cartId, head.id));
      return toCartFromDb(head, lineRows);
    },

    async findByCustomerId(customerId: CustomerId): Promise<Cart | null> {
      const [head] = await db
        .select()
        .from(carts)
        .where(eq(carts.customerId, customerId))
        .limit(1);
      if (head === undefined) {
        return null;
      }
      const lineRows = await db
        .select()
        .from(cartLines)
        .where(eq(cartLines.cartId, head.id));
      return toCartFromDb(head, lineRows);
    },
  };
}
