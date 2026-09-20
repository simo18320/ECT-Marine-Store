// Shipping rule: Italy is free from `freeThreshold` (goods total, VAT included, as shown to
// customers) and a flat `fee` (net) below it; any other destination is by quote only.
// Pure — used by the checkout UI for display and by the server action as the source of truth.

export const SHIPPING_VAT_RATE = 22;

const ITALY_ALIASES = new Set(["italy", "italia", "it", "ita"]);

export function isItaly(country: string | null | undefined): boolean {
  return !!country && ITALY_ALIASES.has(country.trim().toLowerCase());
}

export interface ShippingSettings {
  freeThreshold: number;
  feeItaly: number;
}

export type ShippingQuote =
  | { kind: "free"; net: 0; vat: 0 }
  | { kind: "fee"; net: number; vat: number }
  | { kind: "quote"; net: 0; vat: 0 };

function round2(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function computeShipping(input: {
  goodsGross: number;
  country: string | null | undefined;
  settings: ShippingSettings;
}): ShippingQuote {
  if (!isItaly(input.country)) return { kind: "quote", net: 0, vat: 0 };
  if (input.goodsGross >= input.settings.freeThreshold) return { kind: "free", net: 0, vat: 0 };
  const net = round2(input.settings.feeItaly);
  return { kind: "fee", net, vat: round2(net * (SHIPPING_VAT_RATE / 100)) };
}
