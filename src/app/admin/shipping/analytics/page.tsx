import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { aggregateProducts, aggregateShipping, loadAnalytics, type ProductProfitRow } from "@/lib/shipping/analytics";
import { formatCurrency } from "@/lib/utils";

const RANGES = [
  { key: "today", label: "Today", days: 0 },
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
] as const;

const SORTS: { key: keyof ProductProfitRow; label: string }[] = [
  { key: "revenueNet", label: "Revenue" },
  { key: "netProfit", label: "Net profit" },
  { key: "netMarginPercent", label: "Margin" },
  { key: "shippingSubsidy", label: "Shipping subsidy" },
  { key: "units", label: "Units" },
];

function resolveRange(range: string | undefined, from: string | undefined, to: string | undefined) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const tomorrow = new Date(startOfToday.getTime() + 86_400_000);
  if (range === "custom" && from && to) {
    const f = new Date(`${from}T00:00:00`);
    const t = new Date(`${to}T00:00:00`);
    if (!Number.isNaN(f.getTime()) && !Number.isNaN(t.getTime()) && f <= t) {
      return { key: "custom", start: f, end: new Date(t.getTime() + 86_400_000) };
    }
  }
  const preset = RANGES.find((r) => r.key === range) ?? RANGES[2];
  return { key: preset.key, start: new Date(startOfToday.getTime() - preset.days * 86_400_000), end: tomorrow };
}

export default async function ShippingAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string; sort?: string; lowOnly?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const range = resolveRange(sp.range, sp.from, sp.to);
  const { orders, items } = await loadAnalytics(range.start, range.end);
  const kpi = aggregateShipping(orders);

  const sortKey = SORTS.find((s) => s.key === sp.sort)?.key ?? "revenueNet";
  const min = 30; // display band only; per-order status uses the configured minimum
  const products = aggregateProducts(orders, items)
    .filter((p) => sp.lowOnly !== "1" || p.netMarginPercent === null || p.netMarginPercent < min)
    .sort((a, b) => ((b[sortKey] as number | null) ?? -Infinity) - ((a[sortKey] as number | null) ?? -Infinity));

  const qs = (extra: Record<string, string>) =>
    "?" + new URLSearchParams({ range: range.key, ...(sp.from ? { from: sp.from } : {}), ...(sp.to ? { to: sp.to } : {}), ...(sp.sort ? { sort: sp.sort } : {}), ...extra }).toString();
  const money = (n: number | null) => (n === null ? "—" : formatCurrency(n));
  const pct = (n: number | null) => (n === null ? "—" : `${n.toFixed(1)}%`);

  const kpis: [string, string][] = [
    ["Orders", String(kpi.totalOrders)],
    ["Free-shipping orders", `${kpi.freeShippingOrders} (${kpi.freeShippingPercent}%)`],
    ["Avg shipping cost", money(kpi.avgShippingCost)],
    ["Avg shipping revenue", money(kpi.avgShippingRevenue)],
    ["Avg shipping subsidy", money(kpi.avgSubsidy)],
    ["Total shipping subsidy", money(kpi.totalSubsidy)],
    ["Avg net margin", pct(kpi.avgNetMarginPercent)],
    ["Below minimum margin", String(kpi.belowMinMargin)],
    ["Negative margin", String(kpi.negativeMargin)],
    ["Unreliable (missing cost)", String(kpi.unreliable)],
  ];

  return (
    <div>
      <Link href="/admin/shipping" className="text-sm text-muted-foreground hover:text-foreground">
        ← Shipping &amp; margin
      </Link>
      <h1 className="mb-4 mt-3 text-3xl font-medium">Shipping profitability</h1>

      <div className="mb-6 flex flex-wrap items-end gap-2 text-sm">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`?range=${r.key}`}
            className={`rounded-full border px-3 py-1 ${range.key === r.key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
          >
            {r.label}
          </Link>
        ))}
        <form className="ml-2 flex items-end gap-2">
          <input type="hidden" name="range" value="custom" />
          <label className="flex flex-col text-xs text-muted-foreground">
            From
            <input type="date" name="from" defaultValue={sp.from} required className="rounded-md border border-input bg-card px-2 py-1 text-sm text-foreground" />
          </label>
          <label className="flex flex-col text-xs text-muted-foreground">
            To
            <input type="date" name="to" defaultValue={sp.to} required className="rounded-md border border-input bg-card px-2 py-1 text-sm text-foreground" />
          </label>
          <button type="submit" className="rounded-md border border-border px-3 py-1 hover:bg-secondary">
            Apply
          </button>
        </form>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Paid, processing, shipped and delivered orders only — cancelled, refunded and unpaid orders are excluded. Margins use revenue
        excluding VAT. Figures come from the snapshot taken when each order was placed.
      </p>

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-medium">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Product profitability</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Sort by</span>
          {SORTS.map((s) => (
            <Link key={s.key} href={qs({ sort: s.key, ...(sp.lowOnly ? { lowOnly: sp.lowOnly } : {}) })} className={`rounded-full border px-2.5 py-1 ${sortKey === s.key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>
              {s.label}
            </Link>
          ))}
          <Link href={qs({ lowOnly: sp.lowOnly === "1" ? "0" : "1" })} className="rounded-full border border-border px-2.5 py-1 hover:bg-secondary">
            {sp.lowOnly === "1" ? "Show all" : "Below 30% only"}
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2 text-right">Orders</th>
              <th className="px-3 py-2 text-right">Units</th>
              <th className="px-3 py-2 text-right">Revenue</th>
              <th className="px-3 py-2 text-right">Cost</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">Ship subsidy</th>
              <th className="px-3 py-2 text-right">Fees + pack.</th>
              <th className="px-3 py-2 text-right">Net profit</th>
              <th className="px-3 py-2 text-right">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.productId ?? p.sku}>
                <td className="px-3 py-2">
                  {p.name}
                  <span className="ml-1 text-xs text-muted-foreground">{p.sku}</span>
                  {p.missingCost && <span className="ml-2 text-xs text-status-warning">missing cost</span>}
                </td>
                <td className="px-3 py-2 text-right">{p.orders}</td>
                <td className="px-3 py-2 text-right">{p.units}</td>
                <td className="px-3 py-2 text-right">{money(p.revenueNet)}</td>
                <td className="px-3 py-2 text-right">{money(p.productCost)}</td>
                <td className="px-3 py-2 text-right">{money(p.grossProfit)}</td>
                <td className="px-3 py-2 text-right">{money(p.shippingSubsidy)}</td>
                <td className="px-3 py-2 text-right">{money(p.paymentFees + p.packaging)}</td>
                <td className={`px-3 py-2 text-right ${p.netProfit !== null && p.netProfit < 0 ? "text-status-critical" : ""}`}>{money(p.netProfit)}</td>
                <td className={`px-3 py-2 text-right font-medium ${p.netMarginPercent !== null && p.netMarginPercent < 0 ? "text-status-critical" : p.netMarginPercent !== null && p.netMarginPercent < min ? "text-status-warning" : ""}`}>{pct(p.netMarginPercent)}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                  No orders in this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
