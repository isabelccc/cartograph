/**
 * customer — customer.service (service)
 *
 * ## Requirements
 *
 * - **R-DOM-1** — Use **`CustomerRepositoryPort` only**; no SQL/Drizzle here.
 * - **R-DOM-3** — If you add account lifecycle, use explicit transitions + typed errors.
 * - **PII** — Normalize email at the boundary (`trim` + lowercase) before persistence and lookups.
 *
 * ## Public API (factory return value)
 *
 * | Method | Purpose |
 * |--------|---------|
 * | **`getCustomerById`** | Load one customer by id. |
 * | **`findCustomerByEmail`** | Login / duplicate check; input email is normalized. |
 * | **`saveCustomer`** | Upsert; email is normalized; rejects empty email after normalization. |
 *
 * TODO:
 * - [ ] Groups / tags, soft-delete, status transitions.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — customer
 */
import { DomainError } from "../../domain-contracts/src/index.js";
import type { CustomerRepositoryPort } from "./customer.repository.port.js";
import type { Customer, CustomerId } from "./customer.types.js";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type CustomerServiceDeps = {
  readonly customerRepo: CustomerRepositoryPort;
};

/**
 * Factory: `const customerService = createCustomerService({ customerRepo })`.
 */
export function createCustomerService(deps: CustomerServiceDeps) {
  return {
    async getCustomerById(id: CustomerId): Promise<Customer | null> {
      return deps.customerRepo.getById(id);
    },

    async findCustomerByEmail(email: string): Promise<Customer | null> {
      const normalized = normalizeEmail(email);
      if (normalized === "") {
        return null;
      }
      return deps.customerRepo.findByEmail(normalized);
    },

    async saveCustomer(customer: Customer): Promise<void> {
      const email = normalizeEmail(customer.email);
      if (email === "") {
        throw new DomainError("CUSTOMER_EMAIL_INVALID", "email is required");
      }
      await deps.customerRepo.save({ ...customer, email });
    },
  };
}

export type CustomerService = ReturnType<typeof createCustomerService>;
