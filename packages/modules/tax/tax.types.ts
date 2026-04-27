/**
 * tax — tax.types (types)
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — tax
 */
export type TaxRateId = string & { readonly __brand: "TaxRateId" };

export function toTaxRateId(id: string): TaxRateId {
  return id as TaxRateId;
}

export type TaxRate = {
  readonly id: TaxRateId;
  readonly name: string;
  /** ISO 3166-1 alpha-2, uppercased. */
  readonly countryCode: string;
  /** Basis points (e.g. 825 = 8.25%). */
  readonly rateBps: number;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};
