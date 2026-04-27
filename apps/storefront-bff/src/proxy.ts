/**
 * Forward `/api/*` to core-api `CORE_API_URL` + `corePrefix` (default `/store/v1`).
 * Register before `express.json()` so request bodies stream through.
 */
import type { Express, Request, Response } from "express";

function forwardHeaders(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined || key.toLowerCase() === "host") {
      continue;
    }
    out[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  return out;
}

export function registerCoreApiProxy(
  app: Express,
  opts: { readonly mountPath: string; readonly corePrefix: string },
): void {
  const coreBase = (process.env.CORE_API_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  const prefix = opts.corePrefix.replace(/\/$/, "");
  const mount = opts.mountPath.replace(/\/$/, "");

  app.use(mount, async (req: Request, res: Response) => {
    const { search } = new URL(req.originalUrl, "http://127.0.0.1");
    const pathSuffix = req.url.length > 0 ? req.url : "/";
    const url = `${coreBase}${prefix}${pathSuffix}${search}`;

    try {
      const body =
        req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS"
          ? undefined
          : await new Promise<Buffer>((resolve, reject) => {
              const chunks: Buffer[] = [];
              req.on("data", (c) => chunks.push(Buffer.from(c)));
              req.on("end", () => resolve(Buffer.concat(chunks)));
              req.on("error", reject);
            });

      const r = await fetch(url, {
        method: req.method,
        headers: forwardHeaders(req),
        body: body !== undefined && body.length > 0 ? new Uint8Array(body) : undefined,
      });

      res.status(r.status);
      const hopByHop = new Set(["connection", "transfer-encoding", "keep-alive"]);
      for (const [k, v] of r.headers) {
        if (hopByHop.has(k.toLowerCase())) {
          continue;
        }
        res.appendHeader(k, v);
      }
      const buf = Buffer.from(await r.arrayBuffer());
      res.send(buf);
    } catch (err) {
      res.status(502).type("application/json").json({
        error: "bad_gateway",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
