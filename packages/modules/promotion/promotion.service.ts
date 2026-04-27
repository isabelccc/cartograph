/**
 * promotion — promotion.service (service)
 *
 * Applies a simple basis-points discount to an order subtotal (MVP rules engine).
 */
export type PromotionService = {
  readonly apply: (orderSubtotal: {
    amountMinor: bigint;
    currency: string;
  }) => Promise<{ amountMinor: bigint; currency: string }>;
};

export type PromotionServiceOptions = {
  /** Discount in basis points (100 = 1%, 1000 = 10%). */
  readonly discountBps: bigint;
};

export function createPromotionService(opts: PromotionServiceOptions): PromotionService {
  const bps = opts.discountBps < 0n ? 0n : opts.discountBps;
  return {
    async apply(subtotal) {
      if (bps === 0n) {
        return { amountMinor: 0n, currency: subtotal.currency };
      }
      const discount = (subtotal.amountMinor * bps) / 10000n;
      return { amountMinor: discount, currency: subtotal.currency };
    },
  };
}
