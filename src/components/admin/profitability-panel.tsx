import { formatCurrency } from "@/lib/utils";
import { ShippingOverrideForm } from "./shipping-override-form";
import type { Database } from "@/types/database";

type Snapshot = Database["public"]["Tables"]["order_profitability"]["Row"];

const STATUS_STYLE: Record<string, string> = {
  SAFE: "bg-status-good/10 text-status-good",
  WARNING: "bg-status-warning/10 text-status-warning",
  LOSS: "bg-status-critical/10 text-status-critical",
  UNRELIABLE: "bg-secondary text-muted-foreground",
};

const FLAG_LABEL: Record<string, string> = {
  MISSING_COST_DATA: "MISSING COST DATA",
  MISSING_SHIPPING_CLASS: "MISSING SHIPPING CLASS",
  MISSING_WEIGHT: "MISSING WEIGHT",
};

export function ProfitabilityPanel({ snapshot, orderId }: { snapshot: Snapshot; orderId: string }) {
  const money = (n: number | null) => (n === null ? "—" : formatCurrency(Number(n)));
  const row = (label: string, value: string, strong = false) => (
    <div className={`flex justify-between ${strong ? "border-t border-border pt-2 font-semibold" : ""}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
  const subsidy = Number(snapshot.shipping_subsidy);
  return (
    <section className="mt-8 rounded-md border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Profitability (internal)</h2>
        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${STATUS_STYLE[snapshot.margin_status]}`}>
          {snapshot.margin_status}
          {snapshot.margin_status === "UNRELIABLE" ? " — cost data missing" : ""}
        </span>
      </div>

      {snapshot.margin_status === "LOSS" && (
        <p className="mb-3 rounded-md bg-status-critical/10 px-3 py-2 text-sm font-medium text-status-critical">
          ORDER BELOW COST — net loss of {money(Math.abs(Number(snapshot.net_profit)))}.
          {subsidy > 0 && " The shipping subsidy is a contributing factor."}
        </p>
      )}
      {snapshot.flags.length > 0 && (
        <p className="mb-3 text-xs font-medium text-status-warning">{snapshot.flags.map((f) => FLAG_LABEL[f] ?? f).join(" · ")}</p>
      )}

      <dl className="space-y-1.5 text-sm">
        {row("Revenue excl. VAT (goods + shipping charged)", money(snapshot.revenue_net))}
        {row("Product cost", money(snapshot.product_cost))}
        {row("Shipping charged to customer (net)", money(snapshot.customer_shipping_at_order))}
        {row("ECT shipping cost", money(snapshot.shipping_cost_at_order))}
        {row("Shipping subsidy", money(subsidy))}
        {row("Payment fee", money(snapshot.payment_fee_at_order))}
        {row("Packaging", money(snapshot.packaging_cost_at_order))}
        {row("Gross profit (goods − cost)", money(snapshot.gross_profit))}
        {row("Net profit", money(snapshot.net_profit), true)}
        {row(
          `Net margin (minimum ${snapshot.min_margin_percent ?? "—"}%)`,
          snapshot.net_margin_at_order === null ? "—" : `${Number(snapshot.net_margin_at_order).toFixed(2)}%`,
        )}
        {row("Free shipping", snapshot.free_shipping_at_order ? "YES" : "NO")}
        {row("Zone / class", `${snapshot.shipping_zone} / ${snapshot.shipping_class_at_order ?? "—"}`)}
      </dl>
      {!snapshot.free_shipping_at_order && snapshot.free_shipping_note && (
        <p className="mt-2 text-xs text-muted-foreground">Free shipping not granted: {snapshot.free_shipping_note}</p>
      )}
      {snapshot.override_active && (
        <p className="mt-2 text-xs text-muted-foreground">
          Shipping overridden to {money(snapshot.override_price)} on{" "}
          {snapshot.override_at ? new Date(snapshot.override_at).toLocaleString("en-GB") : "—"} — “{snapshot.override_reason}”
        </p>
      )}
      <ShippingOverrideForm orderId={orderId} />
    </section>
  );
}
