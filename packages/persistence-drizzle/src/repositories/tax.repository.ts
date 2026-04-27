/**
 * Drizzle repository implementing {@link TaxRepositoryPort}.
 */
import { asc, eq } from "drizzle-orm";
import type { TaxRate, TaxRateId } from "../../../modules/tax/tax.types.js";
import { toTaxRateId } from "../../../modules/tax/tax.types.js";
import type { TaxRepositoryPort } from "../../../modules/tax/tax.repository.port.js";
import type { AppDb } from "../client.js";
import { taxRates } from "../schema/tax_rates.js";

function ensureTaxRatesTable(db: AppDb): void {
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS tax_rates (
      id text primary key,
      name text not null,
      country_code text not null,
      rate_bps text not null,
      is_active text not null,
      created_at text not null,
      updated_at text not null
    );
  `);
}

function rowToTaxRate(row: {
  id: string;
  name: string;
  countryCode: string;
  rateBps: string;
  isActive: string;
  createdAt: string;
  updatedAt: string;
}): TaxRate {
  return {
    id: toTaxRateId(row.id),
    name: row.name,
    countryCode: row.countryCode,
    rateBps: Number.parseInt(row.rateBps, 10),
    isActive: row.isActive === "true",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createTaxRepository(db: AppDb): TaxRepositoryPort {
  ensureTaxRatesTable(db);

  return {
    async getById(id: TaxRateId): Promise<TaxRate | null> {
      const [row] = await db.select().from(taxRates).where(eq(taxRates.id, id)).limit(1);
      return row === undefined ? null : rowToTaxRate(row);
    },

    async listActive(): Promise<readonly TaxRate[]> {
      const rows = await db
        .select()
        .from(taxRates)
        .where(eq(taxRates.isActive, "true"))
        .orderBy(asc(taxRates.countryCode), asc(taxRates.name));
      return rows.map(rowToTaxRate);
    },

    async save(rate: TaxRate): Promise<void> {
      if (!Number.isFinite(rate.rateBps) || rate.rateBps < 0) {
        throw new Error("tax rateBps must be a non-negative integer");
      }
      await db.transaction(async (tx) => {
        await tx
          .insert(taxRates)
          .values({
            id: rate.id,
            name: rate.name,
            countryCode: rate.countryCode.toUpperCase(),
            rateBps: String(Math.trunc(rate.rateBps)),
            isActive: String(rate.isActive),
            createdAt: rate.createdAt,
            updatedAt: rate.updatedAt,
          })
          .onConflictDoUpdate({
            target: taxRates.id,
            set: {
              name: rate.name,
              countryCode: rate.countryCode.toUpperCase(),
              rateBps: String(Math.trunc(rate.rateBps)),
              isActive: String(rate.isActive),
              updatedAt: rate.updatedAt,
            },
          });
      });
    },
  };
}
