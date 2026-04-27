/**
 * Checkout: reserve inventory → place order; release reservation on failure.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Workflows
 */
import type { CartId, OrderId, VariantId } from "../../domain-contracts/src/index.js";
import { DomainError } from "../../domain-contracts/src/errors.js";
import type { CartRepositoryPort } from "../../modules/cart/cart.repository.port.js";
import type { InventoryReservationId } from "../../modules/inventory/inventory.types.js";
import type { InventoryService } from "../../modules/inventory/inventory.service.js";
import type { OrderService } from "../../modules/order/order.service.js";

export type CheckoutWorkflowDeps = {
  readonly cartRepo: CartRepositoryPort;
  readonly orderService: OrderService;
  readonly inventoryService: InventoryService;
};

export type CheckoutInput = {
  readonly cartId: CartId;
  readonly reservation: {
    readonly lines: readonly { readonly variantId: VariantId; readonly quantity: bigint }[];
    readonly expiresAt: string;
  };
};

export type CheckoutWorkflowResult =
  | { readonly ok: true; readonly orderId: OrderId; readonly reservationId: InventoryReservationId }
  | { readonly ok: false; readonly reason: string };

export async function runCheckoutWorkflow(
  deps: CheckoutWorkflowDeps,
  input: CheckoutInput,
): Promise<CheckoutWorkflowResult> {
  const cart = await deps.cartRepo.getById(input.cartId);
  if (cart === null) {
    return { ok: false, reason: "cart_not_found" };
  }
  if (cart.lines.length === 0) {
    return { ok: false, reason: "empty_cart" };
  }

  let reservation;
  try {
    reservation = await deps.inventoryService.reserve({
      orderId: null,
      lines: input.reservation.lines,
      expiresAt: input.reservation.expiresAt,
    });
  } catch (e) {
    const reason = e instanceof DomainError ? e.code : "reserve_failed";
    return { ok: false, reason };
  }

  try {
    const order = await deps.orderService.placeFromCart(input.cartId);
    return { ok: true, orderId: order.id, reservationId: reservation.id };
  } catch (e) {
    try {
      await deps.inventoryService.releaseReservation(reservation.id);
    } catch {
      // best-effort compensation
    }
    const reason = e instanceof DomainError ? e.code : "place_order_failed";
    return { ok: false, reason };
  }
}
