"use client";

import { useActionState } from "react";
import {
  saveShippingRates,
  saveShippingSettings,
  type ShippingAdminState,
} from "@/lib/shipping/admin-actions";
import type { RateTable, EngineSettings } from "@/lib/shipping/engine";

const input = "w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm";
const initial: ShippingAdminState = {};

function Status({ state }: { state: ShippingAdminState }) {
  if (state.error) return <p className="text-sm text-destructive">{state.error}</p>;
  if (state.success) return <p className="text-sm text-status-good">Saved.</p>;
  return null;
}

export function ShippingSettingsForm({ settings, provider }: { settings: EngineSettings; provider: string }) {
  const [state, action, pending] = useActionState(saveShippingSettings, initial);
  const field = (name: string, label: string, value: number, hint?: string) => (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input name={name} type="number" step="0.01" min="0" defaultValue={value} className={input} />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {field("default_minimum_net_margin_percent", "Minimum net margin (%)", settings.defaultMinimumNetMarginPercent, "Free shipping is only granted if the order keeps at least this margin.")}
      {field("free_shipping_target", "Free shipping target (€, VAT included)", settings.freeShippingTarget, "Goods total after discounts. Reaching it is necessary, not sufficient.")}
      <label className="flex flex-col gap-1 text-sm">
        Payment provider
        <input name="payment_provider" defaultValue={provider} className={input} />
      </label>
      <span />
      {field("payment_fee_percent", "Payment fee (%)", settings.paymentFeePercent, "Charged on the amount the customer pays.")}
      {field("payment_fixed_fee", "Payment fixed fee (€)", settings.paymentFixedFee)}
      {field("default_packaging_cost", "Default packaging cost per order (€)", settings.defaultPackagingCost, "Used when a product has no packaging cost; the largest one in the cart applies.")}
      {field("included_weight_kg", "Weight included in the tariff (kg)", settings.includedWeightKg)}
      {field("handling_fee_per_extra_kg", "Handling fee per extra kg (€)", settings.handlingFeePerExtraKg, "Added to mixed / heavy carts above the included weight. 0 = disabled.")}
      <div className="flex items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {pending ? "Saving…" : "Save settings"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}

const ZONE_LABEL: Record<string, string> = { IT: "Italy", EU: "EU (non-Italy)", UK: "United Kingdom", INT: "USA & rest of world" };

export function ShippingRatesForm({ rates }: { rates: RateTable }) {
  const [state, action, pending] = useActionState(saveShippingRates, initial);
  return (
    <form action={action}>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Zone</th>
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2">Mode</th>
              <th className="px-3 py-2">Customer charge (€ net)</th>
              <th className="px-3 py-2">ECT cost (€)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(Object.keys(rates) as (keyof RateTable)[]).flatMap((zone) =>
              (["A", "B", "C", "D"] as const).map((cls) => {
                const r = rates[zone][cls];
                return (
                  <tr key={`${zone}${cls}`}>
                    <td className="px-3 py-1.5">{ZONE_LABEL[zone]}</td>
                    <td className="px-3 py-1.5 font-medium">{cls}</td>
                    <td className="px-3 py-1.5">
                      <select name={`mode_${zone}_${cls}`} defaultValue={r.mode} className={input}>
                        <option value="fixed">Online rate</option>
                        <option value="quote">Quotation</option>
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input name={`charge_${zone}_${cls}`} type="number" step="0.01" min="0" defaultValue={r.customerCharge ?? ""} className={input} />
                    </td>
                    <td className="px-3 py-1.5">
                      <input name={`cost_${zone}_${cls}`} type="number" step="0.01" min="0" defaultValue={r.ectCost ?? ""} className={input} />
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {pending ? "Saving…" : "Save rates"}
        </button>
        <Status state={state} />
      </div>
    </form>
  );
}
