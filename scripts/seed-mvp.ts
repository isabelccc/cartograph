/**
 * Idempotent dev seed: one demo product + variant, stock level, US tax rate.
 * Run: npm run db:seed
 */
import path from "node:path";
import { createDrizzleClient } from "../packages/persistence-drizzle/src/client.js";
import { createCatalogRepository } from "../packages/persistence-drizzle/src/repositories/catalog.repository.js";
import { createInventoryRepository } from "../packages/persistence-drizzle/src/repositories/inventory.repository.js";
import { createTaxRepository } from "../packages/persistence-drizzle/src/repositories/tax.repository.js";
import { toProductId, toVariantId } from "../packages/domain-contracts/src/ids.js";
import { toTaxRateId } from "../packages/modules/tax/tax.types.js";
import type { Product } from "../packages/modules/catalog/product.types.js";
import type { StockLevel } from "../packages/modules/inventory/inventory.types.js";
import type { TaxRate } from "../packages/modules/tax/tax.types.js";

const dbPath =
  process.env.DATABASE_PATH !== undefined && process.env.DATABASE_PATH.length > 0
    ? process.env.DATABASE_PATH
    : path.resolve(process.cwd(), "packages/persistence-drizzle/data.sqlite");

const PRODUCT_ID = toProductId("prod_mvp_demo");
const VARIANT_ID = toVariantId("var_mvp_demo");
const TAX_ID = toTaxRateId("tax_mvp_us_sample");

async function main(): Promise<void> {
  const db = createDrizzleClient(dbPath);
  const catalogRepo = createCatalogRepository(db);
  const inventoryRepo = createInventoryRepository(db);
  const taxRepo = createTaxRepository(db);

  const existing = await catalogRepo.getById(PRODUCT_ID);
  const stockExisting = await inventoryRepo.loadStockByVariant(VARIANT_ID);
  const taxExisting = await taxRepo.getById(TAX_ID);

  const catalogOk = existing !== null && existing.variants.length > 0;
  const stockOk = stockExisting !== null;
  const taxOk = taxExisting !== null;

  if (catalogOk && stockOk && taxOk) {
    // eslint-disable-next-line no-console
    console.log("seed: demo data already present, skipping", PRODUCT_ID);
    return;
  }

  const now = new Date().toISOString();
  const product: Product = {
    id: PRODUCT_ID,
    title: "MVP Demo Product",
    description: "Seeded product for Cartograph MVP smoke tests.",
    isActive: true,
    options: ["Default"],
    variants: [
      {
        id: VARIANT_ID,
        productId: PRODUCT_ID,
        title: "Default",
        options: {},
        price: { amountMinor: 1_000n, currency: "USD" },
        compareAtPrice: { amountMinor: 0n, currency: "USD" },
        stock: 100n,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  if (!catalogOk) {
    await catalogRepo.save(product);
    // eslint-disable-next-line no-console
    console.log(
      existing !== null ? "seed: repaired catalog (variants were missing)" : "seed: wrote catalog",
      PRODUCT_ID,
    );
  }

  if (!stockOk) {
    const stock: StockLevel = {
      variantId: VARIANT_ID,
      sku: "SKU-MVP-001",
      onHand: 100n,
      reserved: 0n,
      availableToPromise: 100n,
      updatedAt: now,
    };
    await inventoryRepo.saveStockLevel(stock);
    // eslint-disable-next-line no-console
    console.log("seed: wrote stock", VARIANT_ID);
  }

  if (!taxOk) {
    const tax: TaxRate = {
      id: TAX_ID,
      name: "US sample (8.25%)",
      countryCode: "US",
      rateBps: 825,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await taxRepo.save(tax);
    // eslint-disable-next-line no-console
    console.log("seed: wrote tax", TAX_ID);
  }

  // eslint-disable-next-line no-console
  console.log("seed: ok", { product: PRODUCT_ID, variant: VARIANT_ID, tax: TAX_ID });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
