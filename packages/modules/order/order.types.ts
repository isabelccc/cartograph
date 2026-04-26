/**
 * order — order.types (types)
 *
 * Requirements:
 * - Snapshot line data at submit time.
 * - R-DOM-2: money uses minor units.
 */
import type {
  CustomerId,
  Money,
  OrderId,
  ProductId,
  VariantId,
} from "../../domain-contracts/src/index.js";

export type { CustomerId, Money, OrderId, ProductId, VariantId };

export type OrderStatus = "placed" | "cancelled";

export type OrderLine = {
  readonly id: string;
  readonly productId: ProductId;
  readonly variantId: VariantId;
  readonly title: string;
  readonly quantity: bigint;
  readonly unitPrice: Money;
  readonly lineTotal: Money;
};

export type Order = {
  readonly id: OrderId;
  readonly customerId?: CustomerId | undefined;
  readonly status: OrderStatus;
  readonly currency: string;
  readonly subtotal: Money;
  readonly total: Money;
  readonly lines: readonly OrderLine[];
  readonly createdAt: string;
  readonly updatedAt: string;
};
