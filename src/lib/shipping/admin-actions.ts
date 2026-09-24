"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { profitFromStored, round2 } from "./engine";

export type ShippingAdminState = { error?: string; success?: boolean };

const CLASSES = ["A", "B", "C", "D"] as const;
const ZONES = ["IT", "EU", "UK", "INT"] as const;

function numberField(formData: FormData, name: string): number | null {
  const raw = String(formData.get(name) ?? "").trim().replace(",", ".");
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

export async function saveShippingSettings(_prev: ShippingAdminState, formData: FormData): Promise<ShippingAdminState> {
  const staff = await requireAdmin();
  const supabase = await createClient();

  const values = {
    default_minimum_net_margin_percent: numberField(formData, "default_minimum_net_margin_percent"),
    free_shipping_target: numberField(formData, "free_shipping_target"),
    payment_fee_percent: numberField(formData, "payment_fee_percent"),
    payment_fixed_fee: numberField(formData, "payment_fixed_fee"),
    default_packaging_cost: numberField(formData, "default_packaging_cost"),
    included_weight_kg: numberField(formData, "included_weight_kg"),
    handling_fee_per_extra_kg: numberField(formData, "handling_fee_per_extra_kg"),
  };
  for (const [key, v] of Object.entries(values)) {
    if (v === null || Number.isNaN(v) || v < 0) return { error: `Invalid value for ${key.replace(/_/g, " ")}.` };
  }
  if ((values.default_minimum_net_margin_percent as number) > 95) return { error: "Minimum margin must be below 95%." };
  const provider = String(formData.get("payment_provider") ?? "stripe").trim().slice(0, 40) || "stripe";

  const { data: before } = await supabase.from("shipping_settings").select("*").eq("id", true).maybeSingle();
  const { error } = await supabase
    .from("shipping_settings")
    .upsert({ id: true, ...(values as Record<string, number>), payment_provider: provider, updated_at: new Date().toISOString() });
  if (error) return { error: "Could not save the settings." };

  await supabase.from("audit_logs").insert({
    actor_id: staff.userId,
    action: "shipping_settings_update",
    entity_type: "shipping_settings",
    entity_id: null,
    before: before ?? null,
    after: { ...values, payment_provider: provider },
  });
  revalidatePath("/admin/shipping");
  revalidatePath("/cart");
  return { success: true };
}

export async function saveShippingRates(_prev: ShippingAdminState, formData: FormData): Promise<ShippingAdminState> {
  const staff = await requireAdmin();
  const supabase = await createClient();

  const rows = [];
  for (const zone of ZONES) {
    for (const cls of CLASSES) {
      const mode = formData.get(`mode_${zone}_${cls}`) === "fixed" ? "fixed" : "quote";
      const charge = numberField(formData, `charge_${zone}_${cls}`);
      const cost = numberField(formData, `cost_${zone}_${cls}`);
      if (mode === "fixed") {
        if (charge === null || cost === null || Number.isNaN(charge) || Number.isNaN(cost) || charge < 0 || cost < 0) {
          return { error: `Zone ${zone}, class ${cls}: a fixed rate needs a customer charge and an ECT cost (0 or more).` };
        }
      }
      rows.push({
        zone,
        shipping_class: cls,
        mode,
        customer_charge: mode === "fixed" ? charge : null,
        ect_cost: mode === "fixed" ? cost : null,
      });
    }
  }

  const { data: before } = await supabase.from("shipping_rates").select("*");
  const { error } = await supabase.from("shipping_rates").upsert(rows, { onConflict: "zone,shipping_class" });
  if (error) return { error: "Could not save the rates." };

  await supabase.from("audit_logs").insert({
    actor_id: staff.userId,
    action: "shipping_rates_update",
    entity_type: "shipping_rates",
    entity_id: null,
    before: { rates: before ?? [] },
    after: { rates: rows },
  });
  revalidatePath("/admin/shipping");
  revalidatePath("/cart");
  return { success: true };
}

/**
 * Admin shipping override on one order: records the price the customer should have paid for
 * shipping and recomputes the profitability record from the stored costs. It does not touch the
 * Stripe charge already taken — if the customer must be refunded or billed the difference, that
 * is done in Stripe. Every override is audited (who, when, why, old and new value).
 */
export async function overrideOrderShipping(orderId: string, _prev: ShippingAdminState, formData: FormData): Promise<ShippingAdminState> {
  const staff = await requireAdmin();
  const supabase = await createClient();

  const price = numberField(formData, "override_price");
  const reason = String(formData.get("override_reason") ?? "").trim();
  if (price === null || Number.isNaN(price) || price < 0) return { error: "Enter the shipping price (net, 0 or more)." };
  if (reason.length < 3) return { error: "A reason is required for an override." };

  const { data: snap } = await supabase.from("order_profitability").select("*").eq("order_id", orderId).maybeSingle();
  if (!snap) return { error: "This order has no profitability record." };

  const productRevenueNet = round2(Number(snap.revenue_net) - Number(snap.customer_shipping_at_order));
  const recomputed = profitFromStored({
    productRevenueNet,
    productCost: snap.product_cost === null ? null : Number(snap.product_cost),
    ectShippingCost: Number(snap.shipping_cost_at_order),
    paymentFee: Number(snap.payment_fee_at_order),
    packagingCost: Number(snap.packaging_cost_at_order),
    customerShippingNet: price,
    minMarginPercent: Number(snap.min_margin_percent ?? 30),
  });

  const { error } = await supabase
    .from("order_profitability")
    .update({
      override_active: true,
      override_price: price,
      override_reason: reason,
      override_by: staff.userId,
      override_at: new Date().toISOString(),
      customer_shipping_at_order: price,
      shipping_subsidy: recomputed.shippingSubsidy,
      revenue_net: round2(productRevenueNet + price),
      net_profit: recomputed.netProfit,
      net_margin_at_order: recomputed.netMarginPercent,
      margin_status: recomputed.status,
      free_shipping_at_order: price === 0,
    })
    .eq("order_id", orderId);
  if (error) return { error: "Could not save the override." };

  await supabase.from("audit_logs").insert({
    actor_id: staff.userId,
    action: "order_shipping_override",
    entity_type: "orders",
    entity_id: orderId,
    before: { customer_shipping_net: Number(snap.customer_shipping_at_order), override_active: snap.override_active },
    after: { customer_shipping_net: price, reason },
  });
  const { data: order } = await supabase.from("orders").select("order_number").eq("id", orderId).maybeSingle();
  if (order) revalidatePath(`/admin/orders/${order.order_number}`);
  return { success: true };
}
