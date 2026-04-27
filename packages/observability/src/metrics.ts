/**
 * Prometheus counters/histograms.
 *
 * Default implementation is a no-op; replace with a provider in production.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — observability
 */
export type Metrics = {
  readonly inc: (name: string, value?: number) => void;
  readonly observe: (name: string, value: number) => void;
};

export function createMetrics(): Metrics {
  return {
    inc() {},
    observe() {},
  };
}
