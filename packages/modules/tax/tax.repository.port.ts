/**
 * tax — tax.repository.port (port)
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — tax
 */
import type { TaxRate, TaxRateId } from "./tax.types.js";

export interface TaxRepositoryPort {
  getById(id: TaxRateId): Promise<TaxRate | null>;
  listActive(): Promise<readonly TaxRate[]>;
  save(rate: TaxRate): Promise<void>;
}
