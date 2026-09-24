"use client";

import { useEffect, useRef, useState } from "react";
import type { Database } from "@/types/database";
import { calculateShipping, type EngineProduct, type EngineSettings, type RateTable, type ShippingClass } from "@/lib/shipping/engine";
import { formatCurrency } from "@/lib/utils";

type Product = Database["public"]["Tables"]["products"]["Row"];

export interface ShippingContext {
  settings: EngineSettings;
  rates: RateTable;
}

const input = "rounded-md border border-input bg-card px-3 py-2 text-sm";
const PREVIEW_COUNTRIES = [
  { label: "Italy", country: "Italia" },
  { label: "EU (Germany)", country: "Germany" },
  { label: "UK", country: "United Kingdom" },
];

const num = (v: string | undefined): number | null => {
  if (v === undefined || v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

/** Reads the shipping-related inputs straight from the surrounding form so the preview is live. */
function readProduct(form: HTMLFormElement): { product: EngineProduct; sellingPrice: number; vatRate: number } {
  const data = new FormData(form);
  const get = (name: string) => (data.get(name) as string | null) ?? undefined;
  const cls = get("shipping_class");
  return {
    sellingPrice: num(get("selling_price")) ?? 0,
    vatRate: num(get("vat_rate")) ?? 22,
    product: {
      id: "preview",
      shippingClass: cls === "A" || cls === "B" || cls === "C" || cls === "D" ? (cls as ShippingClass) : null,
      purchaseCost: num(get("purchase_cost")),
      weightKg: num(get("weight_kg")),
      packagingCost: num(get("packaging_cost")),
      freeShippingEligible: data.get("free_shipping_eligible") === "on",
      minimumMarginPercent: num(get("minimum_margin_percent")),
      minimumMarginAmount: num(get("minimum_margin_amount")),
      specialShippingRequired: data.get("special_shipping_required") === "on",
      shippingOverride: data.get("shipping_override") === "on",
      shippingOverrideCost: num(get("shipping_override_cost")),
      shippingCostByZone: {
        IT: num(get("shipping_cost_it")),
        EU: num(get("shipping_cost_eu")),
        UK: num(get("shipping_cost_uk")),
        INT: num(get("shipping_cost_int")),
      },
    },
  };
}

export function ProductShippingSection({ defaultValues, context }: { defaultValues?: Product | null; context: ShippingContext }) {
  const anchor = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState<ReturnType<typeof readProduct> | null>(null);
  const dims = (defaultValues?.dimensions as { length_cm?: number; width_cm?: number; height_cm?: number } | null) ?? {};
  const d = defaultValues;

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;
    const update = () => setPreview(readProduct(form));
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    const first = setTimeout(update, 0);
    return () => {
      clearTimeout(first);
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
    };
  }, []);

  const rows = preview
    ? PREVIEW_COUNTRIES.map(({ label, country }) => {
        const line = (qty: number) => ({ product: preview.product, quantity: qty, unitPriceNet: preview.sellingPrice, vatRate: preview.vatRate });
        const one = calculateShipping({ lines: [line(1)], country, settings: context.settings, rates: context.rates });
        let freeFromQty: number | null = null;
        if (!one.quoteRequired) {
          for (let q = 1; q <= 60; q++) {
            if (calculateShipping({ lines: [line(q)], country, settings: context.settings, rates: context.rates }).freeShipping) {
              freeFromQty = q;
              break;
            }
          }
        }
        return { label, one, freeFromQty };
      })
    : [];

  const missing: string[] = [];
  if (preview) {
    if (!preview.product.shippingClass) missing.push("shipping class");
    if (!preview.product.purchaseCost) missing.push("purchase cost");
  }
  const missingWeight = preview !== null && !preview.product.weightKg;

  return (
    <fieldset className="rounded-md border border-border p-4">
      <legend className="px-2 text-sm font-semibold">Shipping &amp; margin (internal)</legend>
      <div ref={anchor} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm">
            Shipping class
            <select name="shipping_class" defaultValue={d?.shipping_class ?? ""} className={input}>
              <option value="">— not set —</option>
              <option value="A">A — small / light</option>
              <option value="B">B — medium</option>
              <option value="C">C — bulky (quote)</option>
              <option value="D">D — special (quote)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Packaging cost (€)
            <input name="packaging_cost" type="number" step="0.01" min="0" defaultValue={d?.packaging_cost ?? ""} placeholder="default" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Min. net margin (%)
            <input name="minimum_margin_percent" type="number" step="0.1" min="0" defaultValue={d?.minimum_margin_percent ?? ""} placeholder="global" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Min. profit (€)
            <input name="minimum_margin_amount" type="number" step="0.01" min="0" defaultValue={d?.minimum_margin_amount ?? ""} placeholder="none" className={input} />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {(
            [
              ["dim_length_cm", "Length (cm)", dims.length_cm],
              ["dim_width_cm", "Width (cm)", dims.width_cm],
              ["dim_height_cm", "Height (cm)", dims.height_cm],
            ] as const
          ).map(([name, label, value]) => (
            <label key={name} className="flex flex-col gap-1 text-sm">
              {label}
              <input name={name} type="number" step="0.1" min="0" defaultValue={value ?? ""} className={input} />
            </label>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              ["shipping_cost_it", "ECT cost Italy (€)", d?.shipping_cost_it],
              ["shipping_cost_eu", "ECT cost EU (€)", d?.shipping_cost_eu],
              ["shipping_cost_uk", "ECT cost UK (€)", d?.shipping_cost_uk],
              ["shipping_cost_int", "ECT cost intl (€)", d?.shipping_cost_int],
            ] as const
          ).map(([name, label, value]) => (
            <label key={name} className="flex flex-col gap-1 text-sm">
              {label}
              <input name={name} type="number" step="0.01" min="0" defaultValue={value ?? ""} placeholder="class rate" className={input} />
            </label>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="free_shipping_eligible" defaultChecked={d?.free_shipping_eligible ?? true} />
            Eligible for free shipping
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="special_shipping_required" defaultChecked={d?.special_shipping_required ?? false} />
            Special shipping (always by quote)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="shipping_override" defaultChecked={d?.shipping_override ?? false} />
            Fixed shipping price override
          </label>
          <label className="flex items-center gap-2">
            Override price (€ net)
            <input name="shipping_override_cost" type="number" step="0.01" min="0" defaultValue={d?.shipping_override_cost ?? ""} className={`${input} w-28`} />
          </label>
        </div>

        {missing.length > 0 && (
          <p className="text-xs font-medium text-status-warning">
            Missing: {missing.join(", ")}. Until set, this product never gets free shipping and its margin is flagged unreliable.
          </p>
        )}
        {missingWeight && (
          <p className="text-xs text-muted-foreground">No weight set: it does not block sales, but the weight handling fee cannot be applied to mixed carts.</p>
        )}

        {preview && (
          <div className="overflow-x-auto rounded-md bg-secondary/50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview — 1 unit</p>
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-1 pr-3">Destination</th>
                  <th className="py-1 pr-3">Customer pays</th>
                  <th className="py-1 pr-3">ECT cost</th>
                  <th className="py-1 pr-3">Net margin</th>
                  <th className="py-1 pr-3">Status</th>
                  <th className="py-1">Free shipping from</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ label, one, freeFromQty }) => (
                  <tr key={label} className="border-t border-border/60">
                    <td className="py-1 pr-3">{label}</td>
                    {one.quoteRequired || !one.profitability ? (
                      <td className="py-1" colSpan={5}>Quotation required</td>
                    ) : (
                      <>
                        <td className="py-1 pr-3">{formatCurrency(one.customerShippingNet)} + VAT</td>
                        <td className="py-1 pr-3">{formatCurrency(one.profitability.ectShippingCost)}</td>
                        <td className="py-1 pr-3">
                          {one.profitability.netMarginPercent === null ? "—" : `${one.profitability.netMarginPercent.toFixed(1)}%`}
                        </td>
                        <td className="py-1 pr-3 font-medium">{one.profitability.status}</td>
                        <td className="py-1">{freeFromQty ? `${freeFromQty} unit${freeFromQty > 1 ? "s" : ""}` : "not eligible"}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </fieldset>
  );
}
