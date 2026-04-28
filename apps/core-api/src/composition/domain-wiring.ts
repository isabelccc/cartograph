/**
 * **`wireDomain`** — builds every `create*Repository` / `create*Service` needed by HTTP handlers.
 *
 * Purpose: single place to see **dependency injection** for core-api (no globals).
 * - Repositories implement **ports** (each module exposes a `*.repository.port.ts` beside its service).
 * - **`orderService`** wires `publishToOutbox` + `afterOrderPlaced` workflow when `db` exists.
 *
 * Interview angle: domain services **never** import Drizzle directly; they receive ports from here.
 */
import { createCatalogRepository } from "../../../../packages/persistence-drizzle/src/repositories/catalog.repository.js";
import { createCartRepository } from "../../../../packages/persistence-drizzle/src/repositories/cart.repository.js";
import { createOrderRepository } from "../../../../packages/persistence-drizzle/src/repositories/order.repository.js";
import { createFulfillmentRepository } from "../../../../packages/persistence-drizzle/src/repositories/fulfillment.repository.js";
import { createInventoryRepository } from "../../../../packages/persistence-drizzle/src/repositories/inventory.repository.js";
import { createPaymentRepository } from "../../../../packages/persistence-drizzle/src/repositories/payment.repository.js";
import { createTaxRepository } from "../../../../packages/persistence-drizzle/src/repositories/tax.repository.js";
import { createCostEstimationRepository } from "../../../../packages/persistence-drizzle/src/repositories/cost_estimate.repository.js";
import { createAuthzRepository } from "../../../../packages/persistence-drizzle/src/repositories/authz.repository.js";
import { createCatalogService } from "../../../../packages/modules/catalog/catalog.service.js";
import { createCartService } from "../../../../packages/modules/cart/cart.service.js";
import { createOrderService } from "../../../../packages/modules/order/order.service.js";
import { createInventoryService } from "../../../../packages/modules/inventory/inventory.service.js";
import { createPaymentService } from "../../../../packages/modules/payment/payment.service.js";
import { createTaxService } from "../../../../packages/modules/tax/tax.service.js";
import { createPromotionService } from "../../../../packages/modules/promotion/promotion.service.js";
import { createNotificationService } from "../../../../packages/modules/notification/notification.service.js";
import { publishToOutbox } from "../../../../packages/events/src/outbox.publisher.js";
import { runOrderPlacedWorkflow } from "../../../../packages/workflows/src/order-placed.workflow.js";
import type { AppDb } from "../../../../packages/persistence-drizzle/src/client.js";
import type { CreateAppOptions } from "./types.js";

export type WiredDomain = {
  readonly db: AppDb | undefined;
  readonly catalogRepo: ReturnType<typeof createCatalogRepository> | undefined;
  readonly cartRepo: ReturnType<typeof createCartRepository> | undefined;
  readonly orderRepo: ReturnType<typeof createOrderRepository> | undefined;
  readonly authzRepo: ReturnType<typeof createAuthzRepository> | undefined;
  readonly fulfillmentRepo: ReturnType<typeof createFulfillmentRepository> | undefined;
  readonly costEstimateRepo: ReturnType<typeof createCostEstimationRepository> | undefined;
  readonly catalogService: ReturnType<typeof createCatalogService> | undefined;
  readonly cartService: ReturnType<typeof createCartService> | undefined;
  readonly orderService: ReturnType<typeof createOrderService> | undefined;
  readonly inventoryRepo: ReturnType<typeof createInventoryRepository> | undefined;
  readonly paymentRepo: ReturnType<typeof createPaymentRepository> | undefined;
  readonly taxRepo: ReturnType<typeof createTaxRepository> | undefined;
  readonly inventoryService: ReturnType<typeof createInventoryService> | undefined;
  readonly paymentService: ReturnType<typeof createPaymentService> | undefined;
  readonly taxService: ReturnType<typeof createTaxService> | undefined;
};

export function wireDomain(options: CreateAppOptions): WiredDomain {
  const db = options.context.db;
  const catalogRepo = db !== undefined ? createCatalogRepository(db) : undefined;
  const cartRepo = db !== undefined ? createCartRepository(db) : undefined;
  const orderRepo = db !== undefined ? createOrderRepository(db) : undefined;
  const authzRepo = db !== undefined ? createAuthzRepository(db) : undefined;
  const fulfillmentRepo = db !== undefined ? createFulfillmentRepository(db) : undefined;
  const costEstimateRepo = db !== undefined ? createCostEstimationRepository(db) : undefined;
  const catalogService =
    catalogRepo !== undefined ? createCatalogService({ catalogRepo }) : undefined;
  const cartService =
    cartRepo !== undefined && catalogRepo !== undefined
      ? createCartService({ cartRepo, catalogRepo })
      : undefined;
  const promotionBps = options.promotionDiscountBps ?? 0n;
  const promotion =
    promotionBps > 0n ? createPromotionService({ discountBps: promotionBps }) : undefined;
  const notify = createNotificationService({
    log: (channel, body) => {
      options.context.logger.info("notification", { channel, body });
    },
  });
  const orderService =
    orderRepo !== undefined && cartRepo !== undefined
      ? createOrderService({
          orderRepo,
          cartRepo,
          promotion,
          notify,
          publishDomainEvent:
            db !== undefined
              ? (e) => {
                  publishToOutbox(db, { type: e.type, payload: JSON.stringify(e.payload) });
                }
              : undefined,
          afterOrderPlaced: async (order) => {
            await runOrderPlacedWorkflow({ orderId: order.id });
          },
        })
      : undefined;
  const inventoryRepo = db !== undefined ? createInventoryRepository(db) : undefined;
  const paymentRepo = db !== undefined ? createPaymentRepository(db) : undefined;
  const taxRepo = db !== undefined ? createTaxRepository(db) : undefined;
  const inventoryService =
    inventoryRepo !== undefined ? createInventoryService({ inventoryRepo }) : undefined;
  const paymentService =
    paymentRepo !== undefined ? createPaymentService({ paymentRepo }) : undefined;
  const taxService = taxRepo !== undefined ? createTaxService({ taxRepo }) : undefined;

  return {
    db,
    catalogRepo,
    cartRepo,
    orderRepo,
    authzRepo,
    fulfillmentRepo,
    costEstimateRepo,
    catalogService,
    cartService,
    orderService,
    inventoryRepo,
    paymentRepo,
    taxRepo,
    inventoryService,
    paymentService,
    taxService,
  };
}
