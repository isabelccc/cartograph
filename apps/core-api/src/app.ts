/**
 * Compose plugins, mount routes, merge API extensions (Vendure-style app layer).
 *
 * Requirements:
 * - Aggregate routes / services / workflows registered in the plugin manifest.
 * - Separate mount paths for Admin API vs Shop API (e.g. `/admin` vs `/store`).
 *
 * TODO:
 * - [ ] Load plugins from `plugins.manifest` and `configure` in dependency order.
 * - [ ] Mount each plugin’s REST/GraphQL (if enabled) on the same HTTP instance.
 * - [ ] Inject shared context: logger, db, featureFlags, tenant resolver.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Kernel, Plugins
 */
import { randomUUID } from "node:crypto";
import express, { type Application, type NextFunction, type Request, type Response } from "express";
import { asyncHandler } from "../../../packages/api-rest/src/async-handler.js";
import {
  problemFromDomainError,
  problemInternalServerError,
} from "../../../packages/api-rest/src/problem-json.js";
import type { AppDb } from "../../../packages/persistence-drizzle/src/client.js";
import { createCatalogRepository } from "../../../packages/persistence-drizzle/src/repositories/catalog.repository.js";
import { createCartRepository } from "../../../packages/persistence-drizzle/src/repositories/cart.repository.js";
import { createOrderRepository } from "../../../packages/persistence-drizzle/src/repositories/order.repository.js";
import { createCatalogService } from "../../../packages/modules/catalog/catalog.service.js";
import { createCartService } from "../../../packages/modules/cart/cart.service.js";
import { createOrderService } from "../../../packages/modules/order/order.service.js";
import {
  toCartId,
  toProductId,
  toSessionId,
  toVariantId,
} from "../../../packages/domain-contracts/src/ids.js";
import type { CommercePluginRouteContext } from "../../../packages/kernel/src/plugin.types.js";
import { DomainError } from "../../../packages/domain-contracts/src/errors.js";
import { applyPendingMigrations } from "./bootstrap/migrations.js";
import { withApiVersion } from "./http/versioning.js";
import { readyHandler } from "./http/ready.js";
import { requestContextMiddleware } from "./http/request-context.js";
import type { RequestLogger } from "./config/logger.js";
import type { PluginsManifest } from "./plugins.types.js";

declare global {
  namespace Express {
    interface Application {
      /** Shared runtime wired in `createApp` (plugins, routes use this). */
      locals: AppLocals;
    }
  }
}

interface AppLocals {
  readonly ctx: AppContext;
}

export type { PluginsManifest } from "./plugins.types.js";

export interface AppContext {
  logger: RequestLogger;
  db: AppDb | undefined;
  featureFlags: Record<string, boolean>;
  resolveTenant(req: Request): string | null;
  /** Optional cleanup (DB, pools). Called from {@link CreatedApp.close}. */
  dispose?: () => Promise<void>;
}

export interface CreateAppOptions {
  manifest: PluginsManifest;
  context: AppContext;
  adminPath?: string;
  shopPath?: string;
  /** Absolute path to Drizzle SQL migrations folder (contains `meta/_journal.json`). */
  migrationsFolder?: string;
  /** When true, apply pending migrations in {@link CreatedApp.ready} (sync, before listen). */
  applyMigrationsOnStart?: boolean;
}

/** Static info for logs, `/health`, and debugging — not for request routing. */
export interface CreatedAppMeta {
  readonly name: string;
  readonly version: string;
  /** Resolved URL prefixes (e.g. after defaults applied). */
  readonly mountPaths: {
    readonly admin: string;
    readonly shop: string;
  };
  /** Plugin `name`s in load order. */
  readonly pluginNames: readonly string[];
}

/**
 * What `http/server.ts` needs: an Express app plus lifecycle hooks.
 * - `ready` — await before `listen` (DB, plugins, migrations).
 * - `close` — idempotent cleanup for tests and graceful shutdown.
 */
export interface CreatedApp {
  readonly express: Application;
  ready(): Promise<void>;
  readonly meta: CreatedAppMeta;
  close(): Promise<void>;
}

const CORE_API_NAME = "core-api";
const CORE_API_VERSION = "0.0.0";

/**
 * Build the Express application: shared context, mount paths, plugin routes (when plugins expose registrars).
 *
 * **Order of work inside (typical):**
 * 1. `express()` + defaults for `adminPath` / `shopPath`.
 * 2. Attach {@link AppContext} once (`app.locals.ctx`) so handlers read `req.app.locals.ctx`.
 * 3. For each plugin in `manifest` (dependency order): call `configure` / `registerRoutes` when those exist on {@link CommercePlugin}.
 * 4. Mount Admin vs Shop routers under the chosen prefixes.
 * 5. Return `{ express, ready, meta, close }` — `ready`/`close` grow as DB and plugins need lifecycle.
 */
function installErrorBoundary(app: Application): void {
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const ctx = req.app.locals.ctx;
    const log = req.log ?? ctx.logger;
    if (err instanceof DomainError) {
      const problem = problemFromDomainError(err);
      res.status(problem.status).type("application/problem+json").json(problem);
      return;
    }
    log.error("unhandled_error", {
      path: req.path,
      err: err instanceof Error ? err.message : String(err),
    });
    const problem = problemInternalServerError();
    res.status(problem.status).type("application/problem+json").json(problem);
  });
}

export function createApp(options: CreateAppOptions): CreatedApp {
  const app = express();
  const adminPath = options.adminPath ?? "/admin";
  const shopPath = options.shopPath ?? "/store";

  app.locals.ctx = options.context;

  app.use(express.json({ limit: "1mb" }));
  app.use(requestContextMiddleware());
  app.get("/ready", asyncHandler(readyHandler));

  const adminMount = withApiVersion(adminPath);
  const shopMount = withApiVersion(shopPath);

  const adminRouter = express.Router();
  const shopRouter = express.Router();
  const db = options.context.db;
  const catalogRepo = db !== undefined ? createCatalogRepository(db) : undefined;
  const cartRepo = db !== undefined ? createCartRepository(db) : undefined;
  const orderRepo = db !== undefined ? createOrderRepository(db) : undefined;
  const catalogService =
    catalogRepo !== undefined ? createCatalogService({ catalogRepo }) : undefined;
  const cartService =
    cartRepo !== undefined && catalogRepo !== undefined
      ? createCartService({ cartRepo, catalogRepo })
      : undefined;
  const orderService =
    orderRepo !== undefined && cartRepo !== undefined
      ? createOrderService({ orderRepo, cartRepo })
      : undefined;

  adminRouter.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, surface: "admin" });
  });
  adminRouter.get("/ready", asyncHandler(readyHandler));
  shopRouter.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, surface: "store" });
  });
  shopRouter.get("/ready", asyncHandler(readyHandler));

  if (catalogService !== undefined) {
    shopRouter.get(
      "/catalog/products",
      asyncHandler(async (req, res) => {
        const activeOnly =
          typeof req.query.activeOnly === "string" && req.query.activeOnly === "true";
        const products = await catalogService.listProducts({ activeOnly });
        res.status(200).json({ items: products });
      }),
    );
  }

  if (cartRepo !== undefined) {
    shopRouter.post(
      "/carts",
      asyncHandler(async (req, res) => {
        const now = new Date().toISOString();
        const cartId = toCartId(randomUUID());
        const sessionId =
          typeof req.body?.sessionId === "string" && req.body.sessionId.trim() !== ""
            ? req.body.sessionId
            : req.requestId;
        const currency =
          typeof req.body?.currency === "string" && req.body.currency.trim() !== ""
            ? req.body.currency.trim().toUpperCase()
            : "USD";
        await cartRepo.save({
          id: cartId,
          sessionId: toSessionId(sessionId),
          customerId: undefined,
          currency,
          status: "active",
          createdAt: now,
          updatedAt: now,
          lines: [],
        });
        const created = await cartRepo.getById(cartId);
        res.status(201).json(created);
      }),
    );
  }

  if (cartService !== undefined) {
    shopRouter.post(
      "/carts/:cartId/lines",
      asyncHandler(async (req, res) => {
        const quantity = BigInt(String(req.body?.quantity ?? "1"));
        const line = await cartService.addLine(toCartId(String(req.params.cartId)), {
          productId: toProductId(String(req.body.productId)),
          variantId: toVariantId(String(req.body.variantId)),
          quantity,
        });
        res.status(201).json(line);
      }),
    );
  }

  if (orderService !== undefined) {
    shopRouter.post(
      "/orders",
      asyncHandler(async (req, res) => {
        const order = await orderService.placeFromCart(toCartId(String(req.body.cartId)));
        res.status(201).json(order);
      }),
    );
  }

  const pluginCtx: CommercePluginRouteContext = {
    adminRouter,
    shopRouter,
    asyncHandler,
    db,
  };
  for (const plugin of options.manifest) {
    plugin.registerRoutes?.(pluginCtx);
  }

  app.use(adminMount, adminRouter);
  app.use(shopMount, shopRouter);

  installErrorBoundary(app);

  const pluginNames = options.manifest.map((p) => p.name);

  return {
    express: app,
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
