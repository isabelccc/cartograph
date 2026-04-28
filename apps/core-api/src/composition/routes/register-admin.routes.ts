/**
 * **Admin storefront API** — all routes under `adminRouter` (mounted as `/admin/v1/...` by `createApp`).
 *
 * Includes: protected `/status`, blanket RBAC + audit middleware, users (authz), cost intakes,
 * order lifecycle (`mark-paid`, …), fulfillments, return eligibility.
 *
 * Deep dive:
 * - **`requireAdmin`** only on routes that must verify `ADMIN_API_KEY` **before** tenant RBAC (e.g. `/status`, `/users`).
 * - **`adminRouter.use`** after `/status`: enforces **tenant + authorize** on **all** subsequent admin routes.
 */
import { randomUUID } from "node:crypto";
import type { RequestHandler, Router } from "express";
import { asyncHandler } from "../../../../../packages/api-rest/src/async-handler.js";
import { authorize } from "../../../../../packages/authz/src/authorize.js";
import { Actions } from "../../../../../packages/authz/src/policies.js";
import { DomainError } from "../../../../../packages/domain-contracts/src/errors.js";
import {
  toFullfillmentId,
  toOrderId,
  toProductIntakeId,
} from "../../../../../packages/domain-contracts/src/ids.js";
import type { Fulfillment } from "../../../../../packages/modules/fulfillment/fulfillment.types.js";
import type { ProductIntake } from "../../../../../packages/modules/cost-estimation/cost-estimation.types.js";
import { publishToOutbox } from "../../../../../packages/events/src/outbox.publisher.js";
import { runReturnWorkflow } from "../../../../../packages/workflows/src/return.workflow.js";
import { readyHandler } from "../../http/ready.js";
import type { WiredDomain } from "../domain-wiring.js";
import { requireAction } from "../middleware.js";

export type RegisterAdminRoutesCtx = {
  readonly adminRouter: Router;
  readonly requireAdmin: RequestHandler;
  readonly wired: WiredDomain;
};

export function registerAdminRoutes(ctx: RegisterAdminRoutesCtx): void {
  const { adminRouter, requireAdmin, wired } = ctx;
  const {
    db,
    authzRepo,
    costEstimateRepo,
    orderRepo,
    orderService,
    fulfillmentRepo,
  } = wired;

  adminRouter.get("/status", requireAdmin, requireAction(Actions.ADMIN_READ), (_req, res) => {
    res.status(200).json({ ok: true, protected: true, surface: "admin" });
  });

  adminRouter.use((req, _res, next) => {
    const action =
      req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS"
        ? Actions.ADMIN_READ
        : Actions.ADMIN_WRITE;
    if (!authorize(req.actorKind, action)) {
      next(new DomainError("FORBIDDEN", `Action not allowed: ${action}`));
      return;
    }
    if (req.tenantId === null) {
      next(new DomainError("TENANT_REQUIRED", "Tenant is required for admin actions"));
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
      req.log.info("audit_admin_mutation", {
        method: req.method,
        path: req.path,
        tenantId: req.tenantId,
        requestId: req.requestId,
        actorKind: req.actorKind,
      });
      req.app.locals.ctx.auditLog?.append({
        action: "admin.mutation",
        detail: {
          method: req.method,
          path: req.path,
          tenantId: req.tenantId,
          requestId: req.requestId,
          actorKind: req.actorKind,
        },
      });
    }
    next();
  });

  adminRouter.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, surface: "admin" });
  });
  adminRouter.get("/ready", asyncHandler(readyHandler));

  if (authzRepo !== undefined) {
    adminRouter.get(
      "/users",
      requireAdmin,
      requireAction(Actions.ADMIN_READ),
      asyncHandler(async (req, res) => {
        const tenantId = req.tenantId;
        if (tenantId === null) {
          throw new DomainError("TENANT_REQUIRED", "Tenant is required");
        }
        const items = await authzRepo.listUsersForTenant(tenantId);
        res.status(200).json({ items });
      }),
    );
    adminRouter.post(
      "/users",
      requireAdmin,
      requireAction(Actions.ADMIN_WRITE),
      asyncHandler(async (req, res) => {
        const tenantId = req.tenantId;
        if (tenantId === null) {
          throw new DomainError("TENANT_REQUIRED", "Tenant is required");
        }
        const email = String(req.body?.email ?? "").trim();
        const name = String(req.body?.name ?? "").trim();
        const role = String(req.body?.role ?? "member").trim();
        const subject = String(req.body?.subject ?? "").trim();
        if (email.length === 0 || subject.length === 0) {
          throw new DomainError("VALIDATION_ERROR", "email and subject are required");
        }
        const now = new Date().toISOString();
        const userId = randomUUID();
        await authzRepo.saveTenant({
          id: tenantId,
          slug: tenantId,
          name: tenantId,
          createdAt: now,
          updatedAt: now,
        });
        await authzRepo.saveUser({
          id: userId,
          externalSubject: subject,
          email,
          name: name.length > 0 ? name : email,
          createdAt: now,
          updatedAt: now,
        });
        await authzRepo.saveMembership({
          id: randomUUID(),
          tenantId,
          userId,
          role,
          createdAt: now,
          updatedAt: now,
        });
        res.status(201).json({ id: userId, email, name, role, tenantId });
      }),
    );
  }

  if (costEstimateRepo !== undefined) {
    adminRouter.get(
      "/cost/intakes",
      requireAdmin,
      asyncHandler(async (req, res) => {
        const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
        const items = await costEstimateRepo.listNeedingReview(limit);
        res.status(200).json({ items });
      }),
    );
    adminRouter.post(
      "/cost/intakes",
      requireAdmin,
      asyncHandler(async (req, res) => {
        const categoryCode = String(req.body?.categoryCode ?? "").trim();
        if (categoryCode.length === 0) {
          throw new DomainError("VALIDATION_ERROR", "categoryCode is required");
        }
        const now = new Date().toISOString();
        const rawPayload =
          req.body?.rawPayload !== undefined &&
          typeof req.body.rawPayload === "object" &&
          req.body.rawPayload !== null &&
          !Array.isArray(req.body.rawPayload)
            ? (req.body.rawPayload as Record<string, unknown>)
            : {};
        const intake: ProductIntake = {
          id: toProductIntakeId(randomUUID()),
          categoryCode,
          schemaVersion:
            typeof req.body?.schemaVersion === "string" && req.body.schemaVersion.trim() !== ""
              ? req.body.schemaVersion.trim()
              : "1",
          status: "draft",
          rawPayload,
          normalizedFeatures: null,
          llmConfidence: null,
          targetRetail: null,
          predictedCostPoint: null,
          predictedCostLow: null,
          predictedCostHigh: null,
          predictedAt: null,
          modelVersion: null,
          featureSchemaVersion: null,
          createdAt: now,
          updatedAt: now,
        };
        await costEstimateRepo.save(intake);
        if (db !== undefined) {
          publishToOutbox(db, {
            type: "cost.intake.created",
            payload: JSON.stringify({ intakeId: intake.id, categoryCode: intake.categoryCode }),
          });
        }
        res.status(201).json(intake);
      }),
    );
  }

  if (orderRepo !== undefined) {
    adminRouter.post(
      "/orders/:orderId/returns/eligibility",
      requireAdmin,
      asyncHandler(async (req, res) => {
        const step = await runReturnWorkflow(
          { orderRepo },
          toOrderId(String(req.params.orderId)),
        );
        res.status(200).json(step);
      }),
    );
  }

  if (orderService !== undefined) {
    adminRouter.post(
      "/orders/:orderId/mark-paid",
      requireAdmin,
      asyncHandler(async (req, res) => {
        const o = await orderService.markPaid(toOrderId(String(req.params.orderId)));
        res.status(200).json(o);
      }),
    );
    adminRouter.post(
      "/orders/:orderId/mark-shipped",
      requireAdmin,
      asyncHandler(async (req, res) => {
        const o = await orderService.markShipped(toOrderId(String(req.params.orderId)));
        res.status(200).json(o);
      }),
    );
    adminRouter.post(
      "/orders/:orderId/mark-delivered",
      requireAdmin,
      asyncHandler(async (req, res) => {
        const o = await orderService.markDelivered(toOrderId(String(req.params.orderId)));
        res.status(200).json(o);
      }),
    );
    adminRouter.post(
      "/orders/:orderId/cancel",
      requireAdmin,
      asyncHandler(async (req, res) => {
        const o = await orderService.cancel(toOrderId(String(req.params.orderId)));
        res.status(200).json(o);
      }),
    );
  }

  if (fulfillmentRepo !== undefined && orderRepo !== undefined) {
    adminRouter.post(
      "/orders/:orderId/fulfillments",
      requireAdmin,
      asyncHandler(async (req, res) => {
        const orderId = toOrderId(String(req.params.orderId));
        const order = await orderRepo.getById(orderId);
        if (order === null) {
          throw new DomainError("ORDER_NOT_FOUND", "Order not found");
        }
        const now = new Date().toISOString();
        const f: Fulfillment = {
          id: toFullfillmentId(randomUUID()),
          orderId,
          lines: order.lines.map((l) => ({
            variantId: l.variantId,
            quantity: l.quantity,
          })),
          status: "pending",
          carrier: null,
          trackingNumber: null,
          trackingUrl: null,
          externalShipmentId: null,
          shippedAt: null,
          deliveredAt: null,
          createdAt: now,
          updatedAt: now,
        };
        await fulfillmentRepo.save(f);
        res.status(201).json(f);
      }),
    );
  }
}
