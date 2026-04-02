/**
 * cart — cart.repository.port (port)
 *
 * Requirements:
 * - **Interface only** — Drizzle/SQL lives in `persistence-drizzle` (R-DOM-1).
 * - Implementations must persist **`Cart` + `lines`** consistently (one transaction where needed).
 * - TODO later: optimistic concurrency (`version` on `Cart`) if you expect concurrent updates.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — cart
 */
import type { Cart, CartId } from "./cart.types.js";
import type { CustomerId } from "../../domain-contracts/src/index.js";

/**
 * Persistence boundary for the **Cart aggregate** (header + line items).
 * Name it `cartRepo` when you inject `createCartService({ cartRepo })`.
 */
export interface CartRepositoryPort {
  /** Load a cart by primary id, including all lines, or `null` if missing. */
  getById(id: CartId): Promise<Cart | null>;

  /**
   * Upsert the full aggregate: cart header and its `lines` (replace lines strategy is fine for v1).
   * Caller is responsible for domain rules; this only stores the snapshot.
   */
  save(cart: Cart): Promise<void>;

  /** Guest flow: find active cart for a browser/session token (optional but common). */
  findBySessionId(sessionId: string): Promise<Cart | null>;

  /** Logged-in flow: find cart for customer (e.g. “one active cart per user” policy). */
  findByCustomerId(customerId: CustomerId): Promise<Cart | null>;
}
