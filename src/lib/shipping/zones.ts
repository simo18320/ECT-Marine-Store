import { countryCode } from "@/lib/countries";

// Destination as the business reasons about it, and the rate zone that prices it. US and the
// rest of the world share the "INT" rate row (the admin sets one international tariff).
export type Destination = "IT" | "EU" | "UK" | "US" | "REST_OF_WORLD";
export type RateZone = "IT" | "EU" | "UK" | "INT";

const EU_CODES = new Set(
  "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE LV LT LU MT NL PL PT RO SK SI ES SE".split(" "),
);

export function destinationOf(country: string | null | undefined): Destination {
  const code = countryCode(country);
  if (code === "IT") return "IT";
  if (code === "GB") return "UK";
  if (code === "US") return "US";
  if (code && EU_CODES.has(code)) return "EU";
  return "REST_OF_WORLD";
}

export function rateZoneOf(destination: Destination): RateZone {
  if (destination === "IT" || destination === "EU" || destination === "UK") return destination;
  return "INT";
}

// Shipping, VAT and customs duties are separate concepts: outside the EU the price we show
// never includes import duties or taxes, which the recipient may owe to customs.
export function dutiesNotIncluded(destination: Destination): boolean {
  return destination === "UK" || destination === "US" || destination === "REST_OF_WORLD";
}
