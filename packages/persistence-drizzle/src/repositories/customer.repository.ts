/**
 * Drizzle repository implementing customer port from `packages/modules/customer`.
 *
 * Requirements:
 * - R-DOM-1: Map rows ↔ `Customer` only; no domain rules.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Persistence
 */
import { eq } from "drizzle-orm";
import { type CustomerId, toCustomerId } from "../../../domain-contracts/src/index.js";
import type { CustomerRepositoryPort } from "../../../modules/customer/customer.repository.port.js";
import type { Customer } from "../../../modules/customer/customer.types.js";
import type { AppDb } from "../client.js";
import { customers } from "../schema/customers.js";

function rowToCustomer(head: {
  id: string;
  email: string;
  name: string;
  status: string;
  shippingAddress: string | null;
  createdAt: string;
  updatedAt: string;
}): Customer {
  return {
    id: toCustomerId(head.id),
    email: head.email,
    name: head.name,
    status: head.status,
    shippingAddress: head.shippingAddress,
    createdAt: head.createdAt,
    updatedAt: head.updatedAt,
  };
}

export function createCustomerRepository(db: AppDb): CustomerRepositoryPort {
  return {
    async getById(id: CustomerId): Promise<Customer | null> {
      const [head] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id))
        .limit(1);
      if (head === undefined) {
        return null;
      }
      return rowToCustomer(head);
    },

    async findByEmail(email: string): Promise<Customer | null> {
      const [head] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, email))
        .limit(1);
      if (head === undefined) {
        return null;
      }
      return rowToCustomer(head);
    },

    async save(customer: Customer): Promise<void> {
      db.transaction((tx) => {
        tx.insert(customers)
          .values({
            id: customer.id,
            email: customer.email,
            name: customer.name,
            status: customer.status,
            shippingAddress: customer.shippingAddress ?? null,
            createdAt: customer.createdAt,
            updatedAt: customer.updatedAt,
          })
          .onConflictDoUpdate({
            target: customers.id,
            set: {
              email: customer.email,
              name: customer.name,
              shippingAddress: customer.shippingAddress ?? null,
              status: customer.status,
              updatedAt: customer.updatedAt,
            },
          })
          .run();
      });
    },
  };
}
