// service_requests.service_type is free text in the schema (not an enum) — these are the only
// two values the booking UI offers today, per the customer-facing request; ECT staff can still
// see/manage a request with any other value entered directly in the database.
export const SERVICE_TYPES = [
  { value: "water_analysis", label: "Water analysis" },
  { value: "air_analysis", label: "Air analysis" },
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];

export function serviceTypeLabel(value: string): string {
  return SERVICE_TYPES.find((t) => t.value === value)?.label ?? value;
}
