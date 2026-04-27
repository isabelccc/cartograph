/**
 * tax — tax.service (service)
 *
 * Resolves active rates from the repository; external nexus/vertex-style providers
 * can wrap or replace `estimateForCountry` later.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — tax
 */
import type { Money } from "../../domain-contracts/src/money.js";
import { add, assertSameCurrency, scaleRational } from "../../domain-contracts/src/money.js";
import type { TaxRepositoryPort } from "./tax.repository.port.js";
import type { TaxRate } from "./tax.types.js";

export type TaxServiceDeps = {
  readonly taxRepo: TaxRepositoryPort;
};

export type TaxEstimateLine = {
  readonly rateName: string;
  readonly rateBps: number;
  readonly tax: Money;
};

export interface TaxService {
  listActiveRates(): Promise<readonly TaxRate[]>;
  /**
   * Applies every active rate for `countryCode` to `taxable` (e.g. multiple layers).
   * If none match, returns zero tax in `taxable.currency`.
   */
  estimateForCountry(input: {
    readonly countryCode: string;
    readonly taxable: Money;
  }): Promise<{ readonly lines: readonly TaxEstimateLine[]; readonly totalTax: Money }>;
}

function zeroMoney(currency: string): Money {
  return { amountMinor: 0n, currency };
}

export function createTaxService(deps: TaxServiceDeps): TaxService {
  return {
    listActiveRates: () => deps.taxRepo.listActive(),

    async estimateForCountry(input) {
      const cc = input.countryCode.toUpperCase();
      const all = await deps.taxRepo.listActive();
      const applicable = all.filter((r) => r.countryCode === cc);
      if (applicable.length === 0) {
        return { lines: [], totalTax: zeroMoney(input.taxable.currency) };
      }

      const lines: TaxEstimateLine[] = applicable.map((rate) => {
        const tax = scaleRational(input.taxable, BigInt(rate.rateBps), 10_000n);
        return { rateName: rate.name, rateBps: rate.rateBps, tax };
      });

      let total = zeroMoney(input.taxable.currency);
      for (const line of lines) {
        assertSameCurrency(total, line.tax);
        total = add(total, line.tax);
      }
      return { lines, totalTax: total };
    },
  };
}
