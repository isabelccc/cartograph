/**
 * Drizzle repository implementing catalog port from `packages/modules/catalog`.
 */
import { eq } from "drizzle-orm";
import {
  toProductId,
  toVariantId,
  type Money,
} from "../../../domain-contracts/src/index.js";
import type { CatalogRepositoryPort } from "../../../modules/catalog/catalog.repository.port.js";
import type { Product } from "../../../modules/catalog/product.types.js";
import type { Variant, VariantId } from "../../../modules/catalog/variant.types.js";
import type { AppDb } from "../client.js";
import { products, variants } from "../schema/index.js";

function parseOptionsJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

function parseVariantOptionsJson(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
    );
  } catch {
    return {};
  }
}

function toMoney(amountMinor: string, currency: string): Money {
  return { amountMinor: BigInt(amountMinor), currency };
}

function rowToVariant(row: {
  id: string;
  productId: string;
  title: string;
  optionsJson: string;
  priceAmountMinor: string;
  priceCurrency: string;
  compareAtAmountMinor: string;
  compareAtCurrency: string;
  stock: string;
  isActive: string;
  createdAt: string;
  updatedAt: string;
}): Variant {
  return {
    id: toVariantId(row.id),
    productId: toProductId(row.productId),
    title: row.title,
    options: parseVariantOptionsJson(row.optionsJson),
    price: toMoney(row.priceAmountMinor, row.priceCurrency),
    compareAtPrice: toMoney(row.compareAtAmountMinor, row.compareAtCurrency),
    stock: BigInt(row.stock),
    isActive: row.isActive === "true",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function ensureCatalogTables(db: AppDb): void {
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id text primary key,
      title text not null,
      description text not null,
      is_active text not null,
      options_json text not null,
      created_at text not null,
      updated_at text not null
    );
  `);
  db.$client.exec(`
    CREATE TABLE IF NOT EXISTS variants (
      id text primary key,
      product_id text not null references products(id) on delete cascade,
      title text not null,
      options_json text not null,
      price_amount_minor text not null,
      price_currency text not null,
      compare_at_amount_minor text not null,
      compare_at_currency text not null,
      stock text not null,
      is_active text not null,
      created_at text not null,
      updated_at text not null
    );
  `);
}

export function createCatalogRepository(db: AppDb): CatalogRepositoryPort {
  ensureCatalogTables(db);

  return {
    async getById(id): Promise<Product | null> {
      const [head] = await db.select().from(products).where(eq(products.id, id)).limit(1);
      if (head === undefined) return null;
      const vRows = await db.select().from(variants).where(eq(variants.productId, id));
      return {
        id: toProductId(head.id),
        title: head.title,
        description: head.description,
        isActive: head.isActive === "true",
        options: parseOptionsJson(head.optionsJson),
        variants: vRows.map(rowToVariant),
        createdAt: head.createdAt,
        updatedAt: head.updatedAt,
      };
    },

    async getByVariantId(id: VariantId): Promise<Variant | null> {
      const [row] = await db.select().from(variants).where(eq(variants.id, id)).limit(1);
      return row === undefined ? null : rowToVariant(row);
    },

    async save(product: Product): Promise<void> {
      await db.transaction(async (tx) => {
        await tx
          .insert(products)
          .values({
            id: product.id,
            title: product.title,
            description: product.description,
            isActive: String(product.isActive),
            optionsJson: JSON.stringify(product.options),
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          })
          .onConflictDoUpdate({
            target: products.id,
            set: {
              title: product.title,
              description: product.description,
              isActive: String(product.isActive),
              optionsJson: JSON.stringify(product.options),
              updatedAt: product.updatedAt,
            },
          });

        await tx.delete(variants).where(eq(variants.productId, product.id));
        for (const v of product.variants) {
          await tx.insert(variants).values({
            id: v.id,
            productId: v.productId,
            title: v.title,
            optionsJson: JSON.stringify(v.options),
            priceAmountMinor: v.price.amountMinor.toString(),
            priceCurrency: v.price.currency,
            compareAtAmountMinor: v.compareAtPrice.amountMinor.toString(),
            compareAtCurrency: v.compareAtPrice.currency,
            stock: v.stock.toString(),
            isActive: String(v.isActive),
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
          });
        }
      });
    },

    async listProducts(options): Promise<readonly Product[]> {
      const pRows =
        options?.activeOnly === true
          ? await db.select().from(products).where(eq(products.isActive, "true"))
          : await db.select().from(products);
      const vRows =
        options?.activeOnly === true
          ? await db.select().from(variants).where(eq(variants.isActive, "true"))
          : await db.select().from(variants);
      const variantsByProduct = new Map<string, Variant[]>();
      for (const v of vRows) {
        const arr = variantsByProduct.get(v.productId) ?? [];
        arr.push(rowToVariant(v));
        variantsByProduct.set(v.productId, arr);
      }

      return pRows.map((p) => ({
        id: toProductId(p.id),
        title: p.title,
        description: p.description,
        isActive: p.isActive === "true",
        options: parseOptionsJson(p.optionsJson),
        variants: variantsByProduct.get(p.id) ?? [],
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    },
  };
}
