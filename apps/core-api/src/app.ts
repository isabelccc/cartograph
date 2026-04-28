/**
 * `createApp` — HTTP **composition root** for core-api (thin shell over domain packages).
 *
 * ## What this file does (vs other folders)
 * - **Here:** Express instance, global middleware (rate limit, CORS), **route registration order**,
 *   mounting `/admin/v1` + `/store/v1`, Stripe webhook **before** `express.json`, plugins, error boundary.
 * - **`composition/domain-wiring.ts`:** constructs `*Repository` + `*Service` (inject ports).
 * - **`composition/routes/register-*`:** concrete REST handlers; **business rules** stay in `packages/modules`.
 * - **`main.ts`:** process bootstrap (env, DB, `createApp`, listen) — not HTTP routing.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Kernel, Plugins
 */
import express, { type Application } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../../packages/api-rest/src/async-handler.js";
import type { CommercePluginRouteContext } from "../../../packages/kernel/src/plugin.types.js";
import { Actions } from "../../../packages/authz/src/policies.js";
import { authorize } from "../../../packages/authz/src/authorize.js";
import { DomainError } from "../../../packages/domain-contracts/src/errors.js";
import { applyPendingMigrations } from "./bootstrap/migrations.js";
import { createRequireAdminApiKey } from "./http/admin-api-key.js";
import { createOptionalShopKeyForMutations } from "./http/shop-api-key.js";
import { createStripeWebhookHandler } from "./http/stripe.js";
import { withApiVersion } from "./http/versioning.js";
import { readyHandler } from "./http/ready.js";
import { requestContextMiddleware } from "./http/request-context.js";
import { createOptionalOidcAuth } from "./http/oidc-auth.js";
import type { PluginsManifest } from "./plugins.types.js";
import { wireDomain } from "./composition/domain-wiring.js";
import { installErrorBoundary } from "./composition/middleware.js";
import { registerAdminRoutes } from "./composition/routes/register-admin.routes.js";
import { registerShopRoutes } from "./composition/routes/register-shop.routes.js";
import type {
  AppContext,
  CreatedApp,
  CreatedAppMeta,
  CreateAppOptions,
} from "./composition/types.js";

export type {
  AppContext,
  CreatedApp,
  CreatedAppMeta,
  CreateAppOptions,
} from "./composition/types.js";
export type { PluginsManifest } from "./plugins.types.js";

const CORE_API_NAME = "core-api";
const CORE_API_VERSION = "0.0.0";

export function createApp(options: CreateAppOptions): CreatedApp {
  const app = express();
  // BigInt is not JSON-serializable by default; API returns money/counts as strings in JSON.
  app.set("json replacer", (_key: string, value: unknown) =>
    typeof value === "bigint" ? value.toString() : value,
  );
  const adminPath = options.adminPath ?? "/admin";
  const shopPath = options.shopPath ?? "/store";

  app.locals.ctx = options.context;

  const rpm = options.rateLimitPerMinute ?? 300;
  if (rpm > 0) {
    app.use(
      rateLimit({
        windowMs: 60_000,
        max: rpm,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  const cors = options.corsOrigin;
  if (cors !== undefined && cors.length > 0) {
    app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", cors);
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Shop-Key, X-Admin-Key, Idempotency-Key, X-Tenant-Id, X-Request-Id",
      );
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }
      next();
    });
  }

  /** All Drizzle repos + domain services used by admin/shop routers (single composition graph). */
  const wired = wireDomain(options);
  const {
    db,
    authzRepo,
    paymentService,
    orderRepo,
    orderService,
  } = wired;

  // Must register before `express.json()` so `req.body` stays raw Buffer for signature verification.
  if (options.stripeWebhookSecret && paymentService !== undefined) {
    app.post(
      "/webhooks/stripe",
      express.raw({ type: "application/json" }),
      asyncHandler(
        createStripeWebhookHandler({
          webhookSecret: options.stripeWebhookSecret,
          paymentService,
          logger: options.context.logger,
          ...(orderRepo !== undefined && orderService !== undefined
            ? { orderRepo, orderService }
            : {}),
        }),
      ),
    );
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(requestContextMiddleware()); // sets requestId, tenantId, actorKind baseline, metrics hook
  app.use(createOptionalOidcAuth(options.oidcVerifier));
  /** Map JWT identity → tenant membership role (can elevate actorKind to `admin`). */
  if (authzRepo !== undefined) {
    app.use(
      asyncHandler(async (req, _res, next) => {
        if (req.identity === undefined || req.tenantId === null) {
          next();
          return;
        }
        const users = await authzRepo.listUsersForTenant(req.tenantId);
        const matched = users.find(
          (row: { user: { externalSubject: string }; membership: { role: string } }) =>
            row.user.externalSubject === req.identity?.subject,
        );
        if (matched?.membership.role === "admin") {
          req.actorKind = "admin";
        }
        next();
      }),
    );
  }
  app.get("/ready", asyncHandler(readyHandler));

  const adminMount = withApiVersion(adminPath);
  const shopMount = withApiVersion(shopPath);

  const adminRouter = express.Router();
  const shopRouter = express.Router();
  shopRouter.use(createOptionalShopKeyForMutations(options.shopApiKey)); // optional SHOP_API_KEY on mutations
  /** When OIDC enabled: shop **writes** require JWT + tenant + SHOP_WRITE (see policies). */
  if (options.oidcVerifier !== undefined) {
    shopRouter.use((req, _res, next) => {
      const isWrite =
        req.method === "POST" ||
        req.method === "PUT" ||
        req.method === "PATCH" ||
        req.method === "DELETE";
      if (!isWrite) {
        next();
        return;
      }
      if (!authorize(req.actorKind, Actions.SHOP_WRITE)) {
        next(new DomainError("FORBIDDEN", "Shop write requires authenticated identity"));
        return;
      }
      if (req.tenantId === null) {
        next(new DomainError("TENANT_REQUIRED", "Tenant is required for shop writes"));
        return;
      }
      next();
    });
  }

  const requireAdmin = createRequireAdminApiKey(options.adminApiKey);

  registerAdminRoutes({
    adminRouter,
    requireAdmin,
    wired,
  });

  registerShopRoutes({
    shopRouter,
    wired,
    options,
  });

  const pluginCtx: CommercePluginRouteContext = {
    adminRouter,
    shopRouter,
    asyncHandler,
    db,
  };
  for (const plugin of options.manifest) {
    plugin.registerRoutes?.(pluginCtx); // plugins extend same routers (Stripe, shipping, search, …)
  }

  // Versioned mounts: e.g. `/admin/v1`, `/store/v1` (see `http/versioning.ts`)
  app.use(adminMount, adminRouter);
  app.use(shopMount, shopRouter);

  installErrorBoundary(app); // last: DomainError → problem+json; other → 500 without stack leak

  const pluginNames = options.manifest.map((p) => p.name);

  return {
    express: app as Application,
    async ready() {
      const { context, applyMigrationsOnStart, migrationsFolder } = options;
      if (
        applyMigrationsOnStart === true &&
        context.db !== undefined &&
        migrationsFolder !== undefined
      ) {
        try {
          applyPendingMigrations(context.db, migrationsFolder);
          context.logger.info("migrations_applied", { folder: migrationsFolder });
        } catch (err) {
          context.logger.error("migrations_failed", { err: String(err) });
          throw err;
        }
      }
      context.logger.info("core-api ready", { name: CORE_API_NAME });
    },
    meta: {
      name: CORE_API_NAME,
      version: CORE_API_VERSION,
      mountPaths: { admin: adminMount, shop: shopMount },
      pluginNames,
    },
    async close() {
      await options.context.dispose?.();
    },
  };
}
