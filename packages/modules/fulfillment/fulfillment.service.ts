/**
 * fulfillment — fulfillment.service (service)
 *
 * Requirements:
 * - R-DOM-1: Services use ports, not Drizzle.
 * - R-DOM-3 where applicable: state machines centralized.
 *
 * TODO:
 * - [ ] create shipment, tracking
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Domain modules — fulfillment
 */

import type{ FulfillmentRepoPort } from "./fullfillment.repository.port.js";
import type{ FulfillmentCarrierPort } from "./fulfillment.carrier.port.js";

export type FulfillmentServiceDeps = {
  readonly fullfillmentRepo: FulfillmentRepoPort;
  readonly fullfillmentCarrier: FulfillmentCarrierPort;
};
export function createFulfillmentService(deps:FulfillmentServiceDeps) {
  
}
