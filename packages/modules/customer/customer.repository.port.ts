/**
 * customer — customer.repository.port (port)
 *
 * Requirements:
 * - **Interface only** — SQL in `persistence-drizzle` (R-DOM-1).
 * - No business rules here; service layer normalizes email, validates status, etc.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — customer
 */
import type { Customer } from "./customer.types.js";
import type { CustomerId } from "../../domain-contracts/src/index.js";

/**
 * Persistence for **Customer** aggregate (one row ≈ one customer).
 * Inject as `customerRepo` into `createCustomerService({ customerRepo })`.
 */
export interface CustomerRepositoryPort {
  /** Primary-key lookup. */
  getById(id: CustomerId): Promise<Customer | null>;

  /** Login / duplicate checks; email should already be normalized by the service. */
  findByEmail(email: string): Promise<Customer | null>;

  /** Insert new or update existing (upsert by `id` or by your chosen natural key — document in impl). */
  save(customer: Customer): Promise<void>;
}
