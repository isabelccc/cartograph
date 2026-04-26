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
import type { CartRepositoryPort } from "../cart/cart.repository.port.js";
import type { OrderRepositoryPort } from "./order.repository.port.js";
import { transitionOrderState } from "./order.state-machine.js";
import type { Order, OrderLine } from "./order.types.js";

export type OrderServiceDeps = {
  readonly orderRepo: OrderRepositoryPort;
  readonly cartRepo: CartRepositoryPort;
};

export function createOrderService(deps: OrderServiceDeps) {
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

      const order: Order = {
        id: toOrderId(randomUUID()),
        customerId: cart.customerId,
        status: "placed",
        currency: cart.currency,
        subtotal,
        total: subtotal,
        lines,
        createdAt: now,
        updatedAt: now,
      };
      await deps.orderRepo.save(order);
      return order;
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
      return next;
    },
  };
}

export type OrderService = ReturnType<typeof createOrderService>;
