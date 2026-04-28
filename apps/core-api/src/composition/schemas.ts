/**
 * **Zod schemas for HTTP bodies** at the edge (validate before domain).
 *
 * Used by `POST /store/v1/checkout` — keeps workflow input explicit (`cartId`, reservation lines, `expiresAt`).
 * Deep dive: quantity coerced to `bigint` here so `runCheckoutWorkflow` matches inventory APIs.
 */
import { z } from "zod";

export const checkoutBodySchema = z.object({
  cartId: z.string().min(1),
  reservation: z.object({
    lines: z.array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.union([z.string(), z.number(), z.bigint()]).transform((v) => BigInt(v)),
      }),
    ),
    expiresAt: z.string().min(1),
  }),
});
