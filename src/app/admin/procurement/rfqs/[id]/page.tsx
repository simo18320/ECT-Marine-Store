import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/guard";
import { getRfqDetail, getScoringWeights } from "@/lib/suppliers/queries";
import { markRfqSupplierSent, createSupplierQuote, createPurchaseOrder } from "@/lib/suppliers/service";
import { generateRfqDraftText } from "@/lib/suppliers/rfq-draft";
import { rankQuotes, QUOTE_LABEL_TEXT, type QuoteForScoring } from "@/lib/suppliers/rules";

export default async function RfqDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const [{ rfq, rfqSuppliers, quotes }, weights] = await Promise.all([getRfqDetail(id), getScoringWeights()]);

  if (!rfq) notFound();
  const isAdmin = staff.role === "ect_admin" || staff.role === "super_admin";

  const scorable: QuoteForScoring[] = quotes
    .filter((q) => q.supplier)
    .map((q) => ({
      id: q.id,
      unitPrice: q.unit_price,
      leadTimeDays: q.lead_time_days,
      moq: q.moq,
      shippingCost: q.shipping_cost,
      paymentTerms: q.payment_terms,
      supplierStatus: q.supplier!.status,
      supplierQualityScore: q.supplier!.quality_score,
      supplierReliabilityScore: q.supplier!.reliability_score,
    }));
  const ranked = rankQuotes(scorable, weights, rfq.quantity);
  const rankedById = new Map(ranked.map((r) => [r.id, r]));

  const markSent = markRfqSupplierSent.bind(null, id);
  const addQuote = createSupplierQuote.bind(null, id);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">{rfq.product?.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {rfq.product?.sku} · qty {rfq.quantity} · <span className="capitalize">{rfq.status}</span>
        {rfq.destination && <> · to {rfq.destination}</>}
        {rfq.requested_delivery_date && <> · requested by {rfq.requested_delivery_date}</>}
      </p>
      {rfq.specification && <p className="mb-8 text-sm text-muted-foreground">Spec: {rfq.specification}</p>}

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Suppliers on this RFQ</h2>
        <div className="flex flex-col gap-4">
          {rfqSuppliers.map((rs) => (
            <details key={rs.supplier_id} className="rounded-md border border-border p-4">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-medium">
                <span>
                  {rs.supplier?.name}{" "}
                  <span className="font-normal capitalize text-muted-foreground">({rs.supplier?.status.replace(/_/g, " ")})</span>
                </span>
                {rs.sent_at ? (
                  <span className="text-xs text-status-good">Sent {new Date(rs.sent_at).toLocaleDateString("en-GB")}</span>
                ) : (
                  <form action={markSent.bind(null, rs.supplier_id)}>
                    <button type="submit" className="text-xs text-primary hover:underline">
                      Mark as sent
                    </button>
                  </form>
                )}
              </summary>
              <pre className="mt-3 whitespace-pre-wrap rounded bg-secondary p-3 text-xs">
                {generateRfqDraftText({
                  supplierName: rs.supplier?.name ?? "",
                  productName: rfq.product?.name ?? "",
                  productSku: rfq.product?.sku ?? "",
                  quantity: rfq.quantity,
                  specification: rfq.specification,
                  destination: rfq.destination,
                  requestedDeliveryDate: rfq.requested_delivery_date,
                })}
              </pre>
            </details>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Record a quote</h2>
        <form action={addQuote} className="flex flex-wrap items-end gap-3 rounded-md border border-border p-4">
          <label className="flex flex-col gap-1 text-sm">
            Supplier
            <select name="supplier_id" required className="min-w-40 rounded-md border border-input bg-card px-3 py-2">
              {rfqSuppliers.map((rs) => (
                <option key={rs.supplier_id} value={rs.supplier_id}>
                  {rs.supplier?.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Unit price
            <input name="unit_price" type="number" step="0.01" required className="w-28 rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Currency
            <input name="currency" defaultValue="EUR" className="w-20 rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            MOQ
            <input name="moq" type="number" min={1} className="w-20 rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Lead time (d)
            <input name="lead_time_days" type="number" min={0} className="w-20 rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Shipping
            <input name="shipping_cost" type="number" step="0.01" className="w-24 rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Duties
            <input name="duties_cost" type="number" step="0.01" className="w-24 rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Handling
            <input name="handling_cost" type="number" step="0.01" className="w-24 rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Payment terms
            <input name="payment_terms" className="w-32 rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Valid until
            <input name="valid_until" type="date" className="rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Add quote
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Quotes, ranked</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          business-rules.md §6: price 30% · lead time 20% · quality 20% · reliability 15% · MOQ fit
          5% · shipping 5% · payment terms 5%. Labels are computed at render time from the current
          quote set, not stored (procurement.md §7).
        </p>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2 text-right">Unit price</th>
                <th className="px-3 py-2 text-right">Landed cost</th>
                <th className="px-3 py-2 text-right">Score</th>
                <th className="px-3 py-2">Labels</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((q) => {
                const scored = rankedById.get(q.id);
                return (
                  <tr key={q.id}>
                    <td className="px-3 py-2">
                      {q.supplier?.name}
                      <div className="text-xs capitalize text-muted-foreground">{q.supplier?.status.replace(/_/g, " ")}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {q.currency} {q.unit_price}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {q.landed_cost !== null ? (
                        `${q.currency} ${q.landed_cost}`
                      ) : (
                        <span className="text-xs text-status-warning">incomplete — purchase price only</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{scored?.score ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {scored?.labels.map((l) => (
                          <span key={l} className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                            {QUOTE_LABEL_TEXT[l]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {rfq.status === "awarded" ? (
                        "—"
                      ) : isAdmin ? (
                        <form action={createPurchaseOrder.bind(null, id, q.id)}>
                          <button type="submit" className="text-xs text-primary hover:underline">
                            Award &amp; create PO
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-muted-foreground">admin only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    No quotes recorded yet.
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
