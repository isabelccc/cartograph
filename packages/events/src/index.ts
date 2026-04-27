/**
 * Events package barrel.
 *
 * @see ../../../../docs/SERIES-B-PLATFORM.md — Events & outbox
 */
export { publishToOutbox } from "./outbox.publisher.js";
export { relayOutboxBatch } from "./outbox.relay.js";
export { createOutboxQueue, createOutboxWorker, OUTBOX_QUEUE } from "./queue.js";
