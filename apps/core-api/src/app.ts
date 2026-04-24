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
import express, { type Application, type NextFunction, type Request, type Response } from "express";
import {
  problemFromDomainError,
  problemInternalServerError,
} from "../../../packages/api-rest/src/problem-json.js";
import type { AppDb } from "../../../packages/persistence-drizzle/src/client.js";
import { DomainError } from "../../../packages/domain-contracts/src/errors.js";
import { withApiVersion } from "./http/versioning.js";
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
  logger: {
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
  };
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
    if (err instanceof DomainError) {
      const problem = problemFromDomainError(err);
      res.status(problem.status).type("application/problem+json").json(problem);
      return;
    }
    ctx.logger.error("unhandled_error", {
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

  const adminMount = withApiVersion(adminPath);
  const shopMount = withApiVersion(shopPath);

  const adminRouter = express.Router();
  const shopRouter = express.Router();

  adminRouter.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, surface: "admin" });
  });
  shopRouter.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, surface: "store" });
  });

  app.use(adminMount, adminRouter);
  app.use(shopMount, shopRouter);

  for (const _plugin of options.manifest) {
    // TODO: when CommercePlugin gains `configure` / `registerRoutes`, run here in order.
  }

  installErrorBoundary(app);

  const pluginNames = options.manifest.map((p) => p.name);

  return {
    express: app,
    async ready() {
      options.context.logger.info("core-api ready", { name: CORE_API_NAME });
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
