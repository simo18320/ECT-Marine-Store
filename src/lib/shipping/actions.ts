"use server";

import { priceCheckoutLines, type CheckoutLineInput } from "@/lib/orders/service";
import { loadEngineProducts, loadRateTable, loadShippingSettings } from "./data";
import { quoteCart, toCustomerView, type CustomerShippingView } from "./provider";

/**
 * Customer-facing shipping preview for the cart, checkout and product pages. Prices come from
 * the database (the client's cart prices are ignored) and the answer carries only what a customer
 * may see — no costs, margins or subsidy.
 */
export async function previewShipping(
  items: CheckoutLineInput[],
  country: string | null | undefined,
): Promise<CustomerShippingView | null> {
  if (items.length === 0) return null;
  try {
    const priced = await priceCheckoutLines(items.map((i) => ({ productId: i.productId, quantity: Math.max(1, Math.floor(i.quantity)) })));
    const { input, result } = await quoteCart(
      priced.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPriceNet: l.unitPrice, vatRate: l.vatRate })),
      country,
    );
    return toCustomerView(input, result);
  } catch {
    return null;
  }
}

/**
 * The one-line shipping note on a product page. Customer-safe: the tariff and the free-shipping
 * target are public, the cost and margin behind them are not. "Free above the target" is worded
 * as a target, never a promise — the engine confirms it per order.
 */
export async function productShippingNote(productId: string): Promise<string | null> {
  const [products, rates, settings] = await Promise.all([loadEngineProducts([productId]), loadRateTable(), loadShippingSettings()]);
  const product = products.get(productId);
  if (!product) return null;
  if (product.specialShippingRequired || product.shippingClass === "D") return "Shipping quotation required";
  if (product.shippingClass === "C") return "Shipping calculated at checkout";
  const tariff = product.shippingClass ? rates.IT[product.shippingClass] : null;
  if (!tariff || tariff.mode !== "fixed" || tariff.customerCharge === null) return "Shipping calculated at checkout";
  const from = `Shipping in Italy from €${tariff.customerCharge.toFixed(2)}`;
  return product.freeShippingEligible ? `${from} · free shipping on eligible orders over €${settings.freeShippingTarget}` : from;
}
