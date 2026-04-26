/**
 * Structured logging (JSON lines) + trace / request id.
 *
 * Requirements:
 * - R-NF-2: Log lines include `requestId`; when known, `tenantId` and other correlation ids.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — R-NF-2
 */
export type LogBindings = Record<string, unknown>;

export type RequestLogger = {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
};

function line(
  level: "info" | "warn" | "error",
  message: string,
  base: LogBindings,
  meta?: Record<string, unknown>,
): void {
  const payload = {
    level,
    msg: message,
    ts: new Date().toISOString(),
    ...base,
    ...meta,
  };
  const s = JSON.stringify(payload);
  if (level === "error") console.error(s);
  else if (level === "warn") console.warn(s);
  else console.log(s);
}

/** Process-level logger (no request bindings). */
export function createRootLogger(base: LogBindings = {}): RequestLogger {
  return {
    info: (m, meta) => line("info", m, base, meta),
    warn: (m, meta) => line("warn", m, base, meta),
    error: (m, meta) => line("error", m, base, meta),
  };
}

/** Per-request logger (R-NF-2). */
export function createRequestLogger(bindings: LogBindings): RequestLogger {
  return createRootLogger(bindings);
}
