# Order — lifecycle, payment, fulfillment, returns

## TODO

- [ ] Outbox events + Sagas for payment ↔ inventory.
- [ ] Partial fulfillments, split shipments, return RMA workflow.

## Requirements

- Order state machine is **explicit**; illegal transitions throw `DomainError`.
- Payment capture: match `orderId`, amount in minor units, idempotent provider refs.

## Function declarations

```ts
// order/order.ts
function transitionOrderStatus(current: OrderStatus, next: OrderStatus): OrderStatus;
function isTerminalOrderStatus(status: OrderStatus): boolean;
function allowsOrderAmendment(status: OrderStatus): boolean;

// order/payment.ts
function applyCapturedPayment(order: PayableOrder, payment: Payment): { order: PayableOrder; payment: Payment };
function isDuplicatePaymentEvent(providerRef: string, seen: ReadonlySet<string>): boolean;
function remainingAuthorizedMinor(authorizedMinor: number, capturedMinor: number): number;

// order/fulfillment.ts
function createShipment(input: CreateShipmentInput): Shipment;
function assertKnownCarrier(carrier: string): void;
function suggestFulfillmentGroups(orderLineIds: readonly string[]): readonly string[][];

// order/returns.ts
function canRequestReturn(orderStatus: OrderStatus): boolean;
function returnBlockReason(orderStatus: OrderStatus): string | undefined;
```

Codes: `INVALID_TRANSITION`, `PAYMENT_ORDER_MISMATCH`, `TRACKING_REQUIRED`, `UNKNOWN_CARRIER`.
