/**
 * Demo async capture: transition `authorized` → `captured`. Real deployments call the PSP capture API here.
 */
import type { AppDb } from "../../../../packages/persistence-drizzle/src/client.js";
import { createPaymentRepository } from "../../../../packages/persistence-drizzle/src/repositories/payment.repository.js";
import Stripe from "stripe";

export async function runPaymentCaptureTick(
  db: AppDb,
  opts?: { readonly stripeSecretKey?: string },
): Promise<number> {
  const repo = createPaymentRepository(db);
  const authorized = await repo.findByStatus("authorized");
  const now = new Date().toISOString();
  const stripe =
    opts?.stripeSecretKey !== undefined
      ? new Stripe(opts.stripeSecretKey, { apiVersion: "2025-08-27.basil" })
      : undefined;
  for (const p of authorized) {
    if (stripe !== undefined && typeof p.providerRef === "string" && p.providerRef.startsWith("pi_")) {
      await stripe.paymentIntents.capture(p.providerRef);
    }
    await repo.save({
      ...p,
      status: "captured",
      updatedAt: now,
    });
  }
  return authorized.length;
}
