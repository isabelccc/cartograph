/**
 * cart — cart.errors (errors)
 *
 * Requirements:
 * - Typed errors for illegal line merge
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * TODO:
 * - [ ] Export error codes
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — cart
 */
export class CartError extends Error {
    readonly code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  }

