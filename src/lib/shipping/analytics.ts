import { createClient } from "@/lib/supabase/server";
import { countsTowardsProfitability, round2 } from "./engine";

export interface AnalyticsOrder {
  orderId: string;
  status: string;
  freeShipping: boolean;
  customerShipping: number;
  shippingCost: number;
  shippingSubsidy: number;
  paymentFee: number;
  packagingCost: number;
  revenueNet: number;
  productCost: number | null;
  netProfit: number | null;
  netMarginPercent: number | null;
  minMarginPercent: number | null;
  marginStatus: "SAFE" | "WARNING" | "LOSS" | "UNRELIABLE";
}

export interface AnalyticsItem {
  orderId: string;
  productId: string | null;
  sku: string;
  name: string;
  quantity: number;
  lineTotal: number; // net of VAT
  unitCost: number | null;
}

export interface ShippingKpis {
  totalOrders: number;
  freeShippingOrders: number;
  freeShippingPercent: number;
  avgShippingCost: number;
  avgShippingRevenue: number;
  avgSubsidy: number;
  totalSubsidy: number;
  avgNetMarginPercent: number | null;
  belowMinMargin: number;
  negativeMargin: number;
  unreliable: number;
}

export function aggregateShipping(orders: AnalyticsOrder[]): ShippingKpis {
  const list = orders.filter((o) => countsTowardsProfitability(o.status));
  const n = list.length;
  const sum = (f: (o: AnalyticsOrder) => number) => list.reduce((s, o) => s + f(o), 0);
  const reliable = list.filter((o) => o.netMarginPercent !== null && o.marginStatus !== "UNRELIABLE");
  const free = list.filter((o) => o.freeShipping).length;
  return {
    totalOrders: n,
    freeShippingOrders: free,
    freeShippingPercent: n === 0 ? 0 : round2((free / n) * 100),
    avgShippingCost: n === 0 ? 0 : round2(sum((o) => o.shippingCost) / n),
    avgShippingRevenue: n === 0 ? 0 : round2(sum((o) => o.customerShipping) / n),
    avgSubsidy: n === 0 ? 0 : round2(sum((o) => o.shippingSubsidy) / n),
    totalSubsidy: round2(sum((o) => o.shippingSubsidy)),
    avgNetMarginPercent:
      reliable.length === 0 ? null : round2(reliable.reduce((s, o) => s + (o.netMarginPercent as number), 0) / reliable.length),
    belowMinMargin: reliable.filter((o) => o.marginStatus === "WARNING" || o.marginStatus === "LOSS").length,
    negativeMargin: reliable.filter((o) => o.marginStatus === "LOSS").length,
    unreliable: list.filter((o) => o.marginStatus === "UNRELIABLE").length,
  };
}

export interface ProductProfitRow {
  productId: string | null;
  sku: string;
  name: string;
  orders: number;
  units: number;
  revenueNet: number;
  productCost: number | null;
  grossProfit: number | null;
  shippingSubsidy: number;
  paymentFees: number;
  packaging: number;
  netProfit: number | null;
  netMarginPercent: number | null;
  missingCost: boolean;
}

/**
 * Per-product profitability. Order-level shipping subsidy, payment fee and packaging are shared
 * across the order's lines in proportion to each line's share of the goods revenue, so the
 * product rows add back up to the orders' totals.
 */
export function aggregateProducts(orders: AnalyticsOrder[], items: AnalyticsItem[]): ProductProfitRow[] {
  const byOrder = new Map(orders.filter((o) => countsTowardsProfitability(o.status)).map((o) => [o.orderId, o]));
  const itemsByOrder = new Map<string, AnalyticsItem[]>();
  for (const item of items) {
    if (!byOrder.has(item.orderId)) continue;
    itemsByOrder.set(item.orderId, [...(itemsByOrder.get(item.orderId) ?? []), item]);
  }

  const rows = new Map<string, ProductProfitRow & { _orders: Set<string> }>();
  for (const [orderId, lines] of itemsByOrder) {
    const order = byOrder.get(orderId)!;
    const goods = lines.reduce((s, l) => s + l.lineTotal, 0);
    for (const line of lines) {
      const share = goods > 0 ? line.lineTotal / goods : 1 / lines.length;
      const key = line.productId ?? line.sku;
      const row =
        rows.get(key) ??
        ({
          productId: line.productId,
          sku: line.sku,
          name: line.name,
          orders: 0,
          units: 0,
          revenueNet: 0,
          productCost: 0,
          grossProfit: 0,
          shippingSubsidy: 0,
          paymentFees: 0,
          packaging: 0,
          netProfit: 0,
          netMarginPercent: null,
          missingCost: false,
          _orders: new Set<string>(),
        } as ProductProfitRow & { _orders: Set<string> });
      row._orders.add(orderId);
      row.units += line.quantity;
      row.revenueNet += line.lineTotal;
      row.shippingSubsidy += order.shippingSubsidy * share;
      row.paymentFees += order.paymentFee * share;
      row.packaging += order.packagingCost * share;
      if (line.unitCost === null || line.unitCost <= 0) row.missingCost = true;
      else row.productCost = (row.productCost ?? 0) + line.unitCost * line.quantity;
      rows.set(key, row);
    }
  }

  return [...rows.values()].map(({ _orders, ...r }) => {
    const revenueNet = round2(r.revenueNet);
    const productCost = r.missingCost ? null : round2(r.productCost ?? 0);
    const grossProfit = productCost === null ? null : round2(revenueNet - productCost);
    const netProfit =
      grossProfit === null ? null : round2(grossProfit - r.shippingSubsidy - r.paymentFees - r.packaging);
    return {
      ...r,
      orders: _orders.size,
      revenueNet,
      productCost,
      grossProfit,
      shippingSubsidy: round2(r.shippingSubsidy),
      paymentFees: round2(r.paymentFees),
      packaging: round2(r.packaging),
      netProfit,
      netMarginPercent: netProfit === null || revenueNet <= 0 ? null : round2((netProfit / revenueNet) * 100),
    };
  });
}

export async function loadAnalytics(from: Date, to: Date): Promise<{ orders: AnalyticsOrder[]; items: AnalyticsItem[] }> {
  const supabase = await createClient();
  const { data: orderRows } = await supabase
    .from("orders")
    .select("id, status, order_profitability(*)")
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString())
    .in("status", ["paid", "processing", "shipped", "delivered"]);

  const orders: AnalyticsOrder[] = [];
  for (const row of orderRows ?? []) {
    const p = Array.isArray(row.order_profitability) ? row.order_profitability[0] : row.order_profitability;
    if (!p) continue;
    orders.push({
      orderId: row.id,
      status: row.status,
      freeShipping: p.free_shipping_at_order,
      customerShipping: Number(p.customer_shipping_at_order),
      shippingCost: Number(p.shipping_cost_at_order),
      shippingSubsidy: Number(p.shipping_subsidy),
      paymentFee: Number(p.payment_fee_at_order),
      packagingCost: Number(p.packaging_cost_at_order),
      revenueNet: Number(p.revenue_net),
      productCost: p.product_cost === null ? null : Number(p.product_cost),
      netProfit: p.net_profit === null ? null : Number(p.net_profit),
      netMarginPercent: p.net_margin_at_order === null ? null : Number(p.net_margin_at_order),
      minMarginPercent: p.min_margin_percent === null ? null : Number(p.min_margin_percent),
      marginStatus: p.margin_status as AnalyticsOrder["marginStatus"],
    });
  }

  const ids = orders.map((o) => o.orderId);
  const { data: itemRows } = ids.length
    ? await supabase
        .from("order_items")
        .select("order_id, product_id, sku_snapshot, name_snapshot, quantity, line_total, unit_cost_snapshot")
        .in("order_id", ids)
    : { data: [] };
  const items: AnalyticsItem[] = (itemRows ?? []).map((i) => ({
    orderId: i.order_id,
    productId: i.product_id,
    sku: i.sku_snapshot,
    name: i.name_snapshot,
    quantity: i.quantity,
    lineTotal: Number(i.line_total),
    unitCost: i.unit_cost_snapshot === null ? null : Number(i.unit_cost_snapshot),
  }));
  return { orders, items };
}
