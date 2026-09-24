// Shipping constants and the Italy check shared by the order code. The rule engine itself
// (zones, classes, free-shipping and margin) lives in src/lib/shipping.

export const SHIPPING_VAT_RATE = 22;

const ITALY_ALIASES = new Set(["italy", "italia", "it", "ita"]);

export function isItaly(country: string | null | undefined): boolean {
  return !!country && ITALY_ALIASES.has(country.trim().toLowerCase());
}
