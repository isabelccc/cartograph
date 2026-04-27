/**
 * Minimal HTTP carrier adapter (Shippo-like API surface).
 */
import type { FulfillmentCarrierPort } from "./fulfillment.carrier.port.js";
import type {
  CarrierLabelReference,
  CarrierTrackingSnapshot,
  PurchaseLabelInput,
  PurchaseLabelResult,
} from "./fulfillment.types.js";

export function createHttpFulfillmentCarrier(opts: {
  readonly baseUrl: string;
  readonly apiKey: string;
}): FulfillmentCarrierPort {
  async function call(path: string, body: unknown): Promise<unknown> {
    const r = await fetch(`${opts.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${opts.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      throw new Error(`carrier call failed: ${r.status}`);
    }
    return r.json();
  }
  return {
    async purchaseLabel(input: PurchaseLabelInput): Promise<PurchaseLabelResult> {
      const out = (await call("/labels", {
        fulfillmentId: input.fulfillmentId,
        packageWeightGrams: input.packageWeightGrams,
        shipFrom: input.shipFrom,
        shipTo: input.shipTo,
        serviceCode: input.serviceCode,
      })) as {
        carrier?: string;
        trackingNumber?: string;
        trackingUrl?: string | null;
        shipmentId?: string;
        labelUrl?: string | null;
      };
      return {
        carrier: out.carrier ?? "http-carrier",
        trackingNumber: out.trackingNumber ?? `trk_${input.fulfillmentId}`,
        trackingUrl: out.trackingUrl ?? null,
        externalShipmentId: out.shipmentId ?? `shp_${input.fulfillmentId}`,
        labelUrl: out.labelUrl ?? null,
      };
    },
    async voidLabel(ref: CarrierLabelReference): Promise<void> {
      await call("/labels/void", ref);
    },
    async getByTracking(
      trackingNumber: string,
      carrierCode?: string,
    ): Promise<CarrierTrackingSnapshot | null> {
      const out = (await call("/tracking", { trackingNumber, carrierCode })) as {
        statusSummary?: string;
        deliveredAt?: string | null;
      };
      return {
        trackingNumber,
        carrier: carrierCode ?? "http-carrier",
        statusSummary: out.statusSummary ?? "unknown",
        deliveredAt: out.deliveredAt ?? null,
      };
    },
  };
}
