import {
  amountToUnlockFreeShipping,
  calculateShipping,
  type EngineInput,
  type EngineLine,
  type EngineResult,
} from "./engine";
import { loadEngineProducts, loadRateTable, loadShippingSettings } from "./data";
import { SHIPPING_VAT_RATE } from "@/lib/orders/shipping";

/**
 * Carrier abstraction. Today the only implementation is the admin-configured rate table; a
 * carrier API (MBE, BRT, GLS, DHL…) would implement the same interface and could be slotted in
 * without touching checkout, the engine or the admin screens. Label creation, tracking and
 * carrier pricing are deliberately not built yet.
 */
export interface ShippingProvider {
  readonly name: string;
  /** Price a shipment. `quoteRequired` results have no price. */
  calculateRate(input: EngineInput): EngineResult;
  /** Ask a carrier for a bespoke quote (class C/D, rest of world). Manual for now. */
  requestQuote(input: EngineInput): Promise<{ status: "manual" }>;
  /** Live tracking from a carrier. Tracking today is entered by hand on the shipment. */
  getTracking(trackingNumber: string): Promise<null>;
}

export const configuredRatesProvider: ShippingProvider = {
  name: "configured-rates",
  calculateRate: calculateShipping,
  async requestQuote() {
    return { status: "manual" };
  },
  async getTracking() {
    return null;
  },
};

export interface CartLineInput {
  productId: string;
  quantity: number;
}

export interface PricedCartLine extends CartLineInput {
  unitPriceNet: number;
  vatRate: number;
}

/** Everything the engine needs, loaded fresh from the database for one calculation. */
export async function buildEngineInput(
  lines: PricedCartLine[],
  country: string | null | undefined,
  extra: { discountNet?: number; adminOverridePrice?: number | null } = {},
): Promise<{ input: EngineInput; missingProducts: boolean }> {
  const [products, settings, rates] = await Promise.all([
    loadEngineProducts(lines.map((l) => l.productId)),
    loadShippingSettings(),
    loadRateTable(),
  ]);
  const engineLines: EngineLine[] = [];
  let missingProducts = false;
  for (const l of lines) {
    const product = products.get(l.productId);
    if (!product) {
      missingProducts = true;
      continue;
    }
    engineLines.push({ product, quantity: l.quantity, unitPriceNet: l.unitPriceNet, vatRate: l.vatRate });
  }
  return { input: { lines: engineLines, country, settings, rates, ...extra }, missingProducts };
}

/**
 * What a customer is allowed to see. Costs, margins, subsidies and the reason free shipping was
 * refused stay on the server: the customer just learns the price and, when the engine would
 * really grant it, how far they are from free shipping.
 */
export interface CustomerShippingView {
  kind: "free" | "fee" | "quote";
  net: number;
  vat: number;
  vatRate: number;
  shippingClass: string | null;
  destination: string;
  /** Only set when adding this much would genuinely unlock free shipping. */
  amountToFree: number | null;
  freeShippingTarget: number;
  dutiesNotice: boolean;
  message: string;
}

export function toCustomerView(input: EngineInput, result: EngineResult): CustomerShippingView {
  const kind = result.quoteRequired ? "quote" : result.freeShipping ? "free" : "fee";
  const amountToFree = kind === "fee" && !result.overrideActive ? amountToUnlockFreeShipping(input) : null;
  const money = (n: number) => `€${n.toFixed(2)}`;
  let message: string;
  if (kind === "quote") message = "Shipping quotation required";
  else if (kind === "free") message = "Free shipping";
  else if (amountToFree !== null) message = `Add ${money(amountToFree)} more to qualify for free shipping`;
  else message = `Standard shipping — ${money(result.customerShippingNet)}`;
  return {
    kind,
    net: result.customerShippingNet,
    vat: result.customerShippingVat,
    vatRate: SHIPPING_VAT_RATE,
    shippingClass: result.appliedClass,
    destination: result.destination,
    amountToFree,
    freeShippingTarget: input.settings.freeShippingTarget,
    dutiesNotice: result.dutiesNotice,
    message,
  };
}

/** Price a cart for a destination straight from the database (never the client's prices). */
export async function quoteCart(
  lines: PricedCartLine[],
  country: string | null | undefined,
  discountNet = 0,
) {
  const { input } = await buildEngineInput(lines, country, { discountNet });
  const result = configuredRatesProvider.calculateRate(input);
  return { input, result };
}
