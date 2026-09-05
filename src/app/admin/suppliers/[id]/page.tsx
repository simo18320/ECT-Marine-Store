import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/guard";
import { getSupplier, listSupplierProducts } from "@/lib/suppliers/queries";
import { listActiveProductsForSelect } from "@/lib/admin/inventory";
import { updateSupplier, createSupplierProduct } from "@/lib/suppliers/service";
import { SupplierForm } from "@/components/admin/supplier-form";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const [supplier, supplierProducts, products] = await Promise.all([
    getSupplier(id),
    listSupplierProducts(id),
    listActiveProductsForSelect(),
  ]);

  if (!supplier) notFound();

  const updateWithId = updateSupplier.bind(null, id);
  const addProductWithId = createSupplierProduct.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{supplier.name}</h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="max-w-lg">
          <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Supplier details</h2>
          <SupplierForm action={updateWithId} defaultValues={supplier} submitLabel="Save changes" />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Products this supplier offers</h2>

          <form action={addProductWithId} className="mb-6 flex flex-col gap-3 rounded-md border border-border p-4">
            <label className="flex flex-col gap-1 text-sm">
              ECT product (optional — leave unset for an external SKU only)
              <select name="product_id" className="rounded-md border border-input bg-card px-3 py-2">
                <option value="">— External SKU only —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                External SKU
                <input name="external_sku" className="rounded-md border border-input bg-card px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Unit price
                <input name="unit_price" type="number" step="0.01" className="rounded-md border border-input bg-card px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                MOQ
                <input name="moq" type="number" min={1} className="rounded-md border border-input bg-card px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Lead time (days)
                <input name="lead_time_days" type="number" min={0} className="rounded-md border border-input bg-card px-3 py-2" />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Shipping estimate
                <input name="shipping_estimate" type="number" step="0.01" className="rounded-md border border-input bg-card px-3 py-2" />
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              Description
              <input name="description" className="rounded-md border border-input bg-card px-3 py-2" />
            </label>
            <button type="submit" className="self-start rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Add
            </button>
          </form>

          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Product / SKU</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">MOQ</th>
                  <th className="px-3 py-2 text-right">Lead time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {supplierProducts.map((sp) => (
                  <tr key={sp.id}>
                    <td className="px-3 py-2">
                      {sp.product?.name ?? sp.external_sku ?? "—"}
                      {sp.product && <div className="text-xs text-muted-foreground">{sp.product.sku}</div>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {sp.unit_price !== null ? `${sp.currency} ${sp.unit_price}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{sp.moq ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{sp.lead_time_days !== null ? `${sp.lead_time_days}d` : "—"}</td>
                  </tr>
                ))}
                {supplierProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                      No products recorded for this supplier yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
