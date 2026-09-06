import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { listLowStockProducts, listRfqs } from "@/lib/suppliers/queries";
import { getAvailableStock } from "@/lib/inventory/rules";

const RFQ_STATUS_COLOR: Record<string, string> = {
  draft: "text-muted-foreground",
  sent: "text-status-warning",
  quoted: "text-status-warning",
  awarded: "text-status-good",
  cancelled: "text-status-critical",
};

export default async function ProcurementDashboardPage() {
  await requireStaff();
  const [lowStock, rfqs] = await Promise.all([listLowStockProducts(), listRfqs()]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-medium">Procurement</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Flagged for reorder</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          available_stock ≤ reorder_point (business-rules.md §2). This only flags a product — it
          never creates a purchase order automatically (§23).
        </p>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2 text-right">Available</th>
                <th className="px-4 py-2 text-right">Reorder point</th>
                <th className="px-4 py-2 text-right">Reorder qty</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lowStock.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2">
                    {row.product?.name}
                    <div className="text-xs text-muted-foreground">{row.product?.sku}</div>
                  </td>
                  <td className="px-4 py-2 text-right text-status-warning">{getAvailableStock(row)}</td>
                  <td className="px-4 py-2 text-right">{row.reorder_point}</td>
                  <td className="px-4 py-2 text-right">{row.reorder_quantity}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/procurement/rfqs/new?product=${row.product_id}&quantity=${row.reorder_quantity}`}
                      className="text-primary hover:underline"
                    >
                      Create RFQ
                    </Link>
                  </td>
                </tr>
              ))}
              {lowStock.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nothing flagged — all tracked stock is above its reorder point.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">RFQs</h2>
          <Link href="/admin/procurement/rfqs/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            New RFQ
          </Link>
        </div>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2">Destination</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rfqs.map((rfq) => (
                <tr key={rfq.id}>
                  <td className="px-4 py-2">
                    <Link href={`/admin/procurement/rfqs/${rfq.id}`} className="font-medium hover:underline">
                      {rfq.product?.name ?? "—"}
                    </Link>
                    <div className="text-xs text-muted-foreground">{rfq.product?.sku}</div>
                  </td>
                  <td className="px-4 py-2 text-right">{rfq.quantity}</td>
                  <td className="px-4 py-2 text-muted-foreground">{rfq.destination ?? "—"}</td>
                  <td className={`px-4 py-2 capitalize ${RFQ_STATUS_COLOR[rfq.status]}`}>{rfq.status}</td>
                  <td className="px-4 py-2 text-muted-foreground">{new Date(rfq.created_at).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
              {rfqs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No RFQs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
