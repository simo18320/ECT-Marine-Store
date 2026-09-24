import { createAdminClient } from "@/lib/supabase/admin";
import type { EngineProduct, EngineSettings, RateTable, ShippingClass } from "./engine";

// Runs with the service role: product cost and rate costs are admin-only data (RLS), and the
// engine must see them on the server without ever putting them in a customer-facing response.

export const DEFAULT_SETTINGS: EngineSettings = {
  defaultMinimumNetMarginPercent: 30,
  freeShippingTarget: 150,
  paymentFeePercent: 2.9,
  paymentFixedFee: 0.3,
  defaultPackagingCost: 1.5,
  includedWeightKg: 10,
  handlingFeePerExtraKg: 0,
};

const CLASSES: ShippingClass[] = ["A", "B", "C", "D"];
const ZONES = ["IT", "EU", "UK", "INT"] as const;

export interface ShippingSettingsRow extends EngineSettings {
  paymentProvider: string;
}

export async function loadShippingSettings(): Promise<ShippingSettingsRow> {
  const admin = createAdminClient();
  const { data } = await admin.from("shipping_settings").select("*").eq("id", true).maybeSingle();
  if (!data) return { ...DEFAULT_SETTINGS, paymentProvider: "stripe" };
  return {
    defaultMinimumNetMarginPercent: Number(data.default_minimum_net_margin_percent),
    freeShippingTarget: Number(data.free_shipping_target),
    paymentFeePercent: Number(data.payment_fee_percent),
    paymentFixedFee: Number(data.payment_fixed_fee),
    defaultPackagingCost: Number(data.default_packaging_cost),
    includedWeightKg: Number(data.included_weight_kg),
    handlingFeePerExtraKg: Number(data.handling_fee_per_extra_kg),
    paymentProvider: data.payment_provider,
  };
}

export async function loadRateTable(): Promise<RateTable> {
  const admin = createAdminClient();
  const { data } = await admin.from("shipping_rates").select("*");
  // Anything missing from the table is a quote: the safe default is never to invent a price.
  const table = Object.fromEntries(
    ZONES.map((z) => [
      z,
      Object.fromEntries(
        CLASSES.map((c) => [c, { mode: "quote", customerCharge: null, ectCost: null }]),
      ),
    ]),
  ) as RateTable;
  for (const row of data ?? []) {
    if (!(ZONES as readonly string[]).includes(row.zone) || !CLASSES.includes(row.shipping_class as ShippingClass)) continue;
    table[row.zone as keyof RateTable][row.shipping_class as ShippingClass] = {
      mode: row.mode === "fixed" ? "fixed" : "quote",
      customerCharge: row.customer_charge === null ? null : Number(row.customer_charge),
      ectCost: row.ect_cost === null ? null : Number(row.ect_cost),
    };
  }
  return table;
}

const PRODUCT_COLUMNS =
  "id, shipping_class, purchase_cost, weight_kg, packaging_cost, free_shipping_eligible, minimum_margin_percent, minimum_margin_amount, special_shipping_required, shipping_override, shipping_override_cost, shipping_cost_it, shipping_cost_eu, shipping_cost_uk, shipping_cost_int";

type ProductRow = {
  id: string;
  shipping_class: string | null;
  purchase_cost: number | null;
  weight_kg: number | null;
  packaging_cost: number | null;
  free_shipping_eligible: boolean;
  minimum_margin_percent: number | null;
  minimum_margin_amount: number | null;
  special_shipping_required: boolean;
  shipping_override: boolean;
  shipping_override_cost: number | null;
  shipping_cost_it: number | null;
  shipping_cost_eu: number | null;
  shipping_cost_uk: number | null;
  shipping_cost_int: number | null;
};

const num = (v: number | null) => (v === null || v === undefined ? null : Number(v));

export function toEngineProduct(row: ProductRow): EngineProduct {
  return {
    id: row.id,
    shippingClass: CLASSES.includes(row.shipping_class as ShippingClass) ? (row.shipping_class as ShippingClass) : null,
    purchaseCost: num(row.purchase_cost),
    weightKg: num(row.weight_kg),
    packagingCost: num(row.packaging_cost),
    freeShippingEligible: row.free_shipping_eligible,
    minimumMarginPercent: num(row.minimum_margin_percent),
    minimumMarginAmount: num(row.minimum_margin_amount),
    specialShippingRequired: row.special_shipping_required,
    shippingOverride: row.shipping_override,
    shippingOverrideCost: num(row.shipping_override_cost),
    shippingCostByZone: {
      IT: num(row.shipping_cost_it),
      EU: num(row.shipping_cost_eu),
      UK: num(row.shipping_cost_uk),
      INT: num(row.shipping_cost_int),
    },
  };
}

export async function loadEngineProducts(productIds: string[]): Promise<Map<string, EngineProduct>> {
  const admin = createAdminClient();
  const { data } = await admin.from("products").select(PRODUCT_COLUMNS).in("id", productIds);
  return new Map((data ?? []).map((row) => [row.id, toEngineProduct(row as ProductRow)]));
}

/** Settings + rates for the admin product form's live preview (admin pages only). */
export async function loadShippingContext(): Promise<{ settings: EngineSettings; rates: RateTable }> {
  const [settings, rates] = await Promise.all([loadShippingSettings(), loadRateTable()]);
  return { settings: { ...settings }, rates };
}
