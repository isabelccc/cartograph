/**
 * OpenTelemetry-style tracing.
 *
 * Default: no-op span; wire OTEL in production.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — observability
 */
export type Tracing = {
  readonly startActiveSpan: <T>(name: string, fn: () => T) => T;
};

export function createTracing(): Tracing {
  return {
    startActiveSpan(_name, fn) {
      return fn();
    },
  };
}
