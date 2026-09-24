import type { Database } from "@/types/database";
import type { EngineResult } from "./engine";

type ProfitabilityInsert = Database["public"]["Tables"]["order_profitability"]["Insert"];

/**
 * The audit record of what the engine decided when the order was placed. Rates, settings and
 * product costs change over time; this row keeps the numbers the decision was actually based on.
 */
export function buildProfitabilityRow(orderId: string, result: EngineResult): ProfitabilityInsert | null {
  const p = result.profitability;
  if (!p) return null; // quoted shipping: no online order, nothing to snapshot
  return {
    order_id: orderId,
    shipping_zone: result.destination,
    shipping_class_at_order: result.appliedClass,
    free_shipping_at_order: result.freeShipping,
    free_shipping_note: result.freeShipping ? null : result.freeDeniedReason,
    customer_shipping_at_order: p.customerShippingNet,
    shipping_cost_at_order: p.ectShippingCost,
    shipping_subsidy: p.shippingSubsidy,
    payment_fee_at_order: p.paymentFee,
    packaging_cost_at_order: p.packagingCost,
    revenue_net: p.revenueNet,
    product_cost: p.productCost,
    gross_profit: p.grossProfit,
    net_profit: p.netProfit,
    net_margin_at_order: p.netMarginPercent,
    min_margin_percent: p.minMarginPercent,
    margin_status: p.status,
    missing_cost_data: result.flags.includes("MISSING_COST_DATA"),
    flags: result.flags,
  };
}
