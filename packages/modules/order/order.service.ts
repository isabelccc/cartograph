/**
 * order — order.service (service)
 */
import { randomUUID } from "node:crypto";
import {
  DomainError,
  add,
  toOrderId,
  type CartId,
  type OrderId,
} from "../../domain-contracts/src/index.js";
import type { NotificationService } from "../notification/notification.service.js";
import type { PromotionService } from "../promotion/promotion.service.js";
import type { CartRepositoryPort } from "../cart/cart.repository.port.js";
import type { OrderRepositoryPort } from "./order.repository.port.js";
import { transitionOrderState } from "./order.state-machine.js";
import type { Order, OrderLine } from "./order.types.js";

export type OrderServiceDeps = {
  readonly orderRepo: OrderRepositoryPort;
  readonly cartRepo: CartRepositoryPort;
  readonly promotion?: PromotionService | undefined;
  readonly notify?: NotificationService | undefined;
  /** Emit domain events (e.g. transactional outbox) after successful saves. */
  readonly publishDomainEvent?: (event: {
    readonly type: string;
    readonly payload: Record<string, unknown>;
  }) => void;
  /** Optional saga hook after place (search, analytics). */
  readonly afterOrderPlaced?: (order: Order) => Promise<void>;
};

export function createOrderService(deps: OrderServiceDeps) {
  const notify = deps.notify;

  function emit(type: string, order: Order): void {
    deps.publishDomainEvent?.({
      type,
      payload: {
        orderId: order.id,
        status: order.status,
        customerId: order.customerId ?? null,
        currency: order.currency,
        total: { amountMinor: order.total.amountMinor.toString(), currency: order.total.currency },
        subtotal: { amountMinor: order.subtotal.amountMinor.toString(), currency: order.subtotal.currency },
        updatedAt: order.updatedAt,
      },
    });
  }

  return {
    async placeFromCart(cartId: CartId): Promise<Order> {
      const cart = await deps.cartRepo.getById(cartId);
      if (cart === null) {
        throw new DomainError("CART_NOT_FOUND", "Cart not found");
      }
      if (cart.lines.length === 0) {
        throw new DomainError("ORDER_EMPTY_CART", "Cannot place order with an empty cart");
      }

      const now = new Date().toISOString();
      const lines: readonly OrderLine[] = cart.lines.map((line) => ({
        id: randomUUID(),
        productId: line.productId,
        variantId: line.variantId,
        title: line.title,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      }));

      const subtotal = lines.reduce(
        (sum, line) => add(sum, line.lineTotal),
        { amountMinor: 0n, currency: cart.currency },
      );

      let totalMinor = subtotal.amountMinor;
      if (deps.promotion !== undefined) {
        const discount = await deps.promotion.apply({
          amountMinor: subtotal.amountMinor,
          currency: subtotal.currency,
        });
        totalMinor = subtotal.amountMinor - discount.amountMinor;
        if (totalMinor < 0n) totalMinor = 0n;
      }

      const order: Order = {
        id: toOrderId(randomUUID()),
        customerId: cart.customerId,
        status: "placed",
        currency: cart.currency,
        subtotal,
        total: { amountMinor: totalMinor, currency: cart.currency },
        lines,
        createdAt: now,
        updatedAt: now,
      };
      await deps.orderRepo.save(order);
      emit("order.placed", order);
      await notify?.send({
        channel: "order_placed",
        body: JSON.stringify({ orderId: order.id, status: order.status }),
      });
      await deps.afterOrderPlaced?.(order);
      return order;
    },

    async markPaid(orderId: OrderId): Promise<Order> {
      const order = await deps.orderRepo.getById(orderId);
      if (order === null) {
        throw new DomainError("ORDER_NOT_FOUND", "Order not found");
      }
      const next: Order = {
        ...order,
        status: transitionOrderState(order.status, "paid"),
        updatedAt: new Date().toISOString(),
      };
      await deps.orderRepo.save(next);
      emit("order.paid", next);
      await notify?.send({
        channel: "order_paid",
        body: JSON.stringify({ orderId: next.id }),
      });
      return next;
    },

    async markShipped(orderId: OrderId): Promise<Order> {
      const order = await deps.orderRepo.getById(orderId);
      if (order === null) {
        throw new DomainError("ORDER_NOT_FOUND", "Order not found");
      }
      const next: Order = {
        ...order,
        status: transitionOrderState(order.status, "shipped"),
        updatedAt: new Date().toISOString(),
      };
      await deps.orderRepo.save(next);
      emit("order.shipped", next);
      await notify?.send({
        channel: "order_shipped",
        body: JSON.stringify({ orderId: next.id }),
      });
      return next;
    },

    async markDelivered(orderId: OrderId): Promise<Order> {
      const order = await deps.orderRepo.getById(orderId);
      if (order === null) {
        throw new DomainError("ORDER_NOT_FOUND", "Order not found");
      }
      const next: Order = {
        ...order,
        status: transitionOrderState(order.status, "delivered"),
        updatedAt: new Date().toISOString(),
      };
      await deps.orderRepo.save(next);
      emit("order.delivered", next);
      await notify?.send({
        channel: "order_delivered",
        body: JSON.stringify({ orderId: next.id }),
      });
      return next;
    },

    async cancel(orderId: OrderId): Promise<Order> {
      const order = await deps.orderRepo.getById(orderId);
      if (order === null) {
        throw new DomainError("ORDER_NOT_FOUND", "Order not found");
      }
      const next: Order = {
        ...order,
        status: transitionOrderState(order.status, "cancelled"),
        updatedAt: new Date().toISOString(),
      };
      await deps.orderRepo.save(next);
      emit("order.cancelled", next);
      await notify?.send({
        channel: "order_cancelled",
        body: JSON.stringify({ orderId: next.id }),
      });
      return next;
    },
  };
}

export type OrderService = ReturnType<typeof createOrderService>;
