/**
 * Release expired inventory reservations (worker tick).
 */
import type { AppDb } from "../../../../packages/persistence-drizzle/src/client.js";
import { createInventoryRepository } from "../../../../packages/persistence-drizzle/src/repositories/inventory.repository.js";
import { createInventoryService } from "../../../../packages/modules/inventory/inventory.service.js";

export async function runInventoryReservationTtlTick(db: AppDb): Promise<number> {
  const inventoryRepo = createInventoryRepository(db);
  const inventoryService = createInventoryService({ inventoryRepo });
  const now = new Date().toISOString();
  const expired = await inventoryService.expireReservations(now);
  return expired.length;
}
