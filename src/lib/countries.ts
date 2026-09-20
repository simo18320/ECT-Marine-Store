// ISO 3166-1 alpha-2 codes; names come from Intl so the list never needs hand-translating.
const CODES =
  "AL AD AT BY BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO SM RS SK SI ES SE CH TR UA GB VA " +
  "DZ EG LY MA TN IL LB SY JO SA AE QA KW BH OM " +
  "US CA MX BS BB BZ BM KY CU DO GD JM MQ GP PR LC VC TT AG DM KN TC VG VI AW CW SX " +
  "BR AR CL CO PE UY VE EC " +
  "AU NZ FJ PF NC " +
  "CN JP KR IN SG MY TH ID PH VN HK TW MV LK " +
  "ZA KE TZ SC MU SN NG GH AO MZ MG CV";

export interface CountryOption {
  value: string;
  label: string;
}

// Italy is stored as "Italia": it is what the business's own tools (Fatture in Cloud) expect and
// what the shipping rule recognises. Every other country is stored under its English name.
export function countryOptions(): CountryOption[] {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const others = CODES.split(" ")
    .filter((code) => code !== "IT")
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name }) => ({ value: name, label: name }));
  return [{ value: "Italia", label: "Italia (Italy)" }, ...others];
}
