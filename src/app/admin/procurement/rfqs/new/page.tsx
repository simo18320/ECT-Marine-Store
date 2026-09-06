import { requireStaff } from "@/lib/admin/guard";
import { listActiveProductsForSelect } from "@/lib/admin/inventory";
import { listSuppliersForSelect } from "@/lib/suppliers/queries";
import { createRfq } from "@/lib/suppliers/service";

export default async function NewRfqPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; quantity?: string }>;
}) {
  await requireStaff();
  const { product: prefilledProduct, quantity: prefilledQuantity } = await searchParams;
  const [products, suppliers] = await Promise.all([listActiveProductsForSelect(), listSuppliersForSelect()]);

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-3xl font-medium">New RFQ</h1>
      <form action={createRfq} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Product
          <select
            name="product_id"
            required
            defaultValue={prefilledProduct ?? ""}
            className="rounded-md border border-input bg-card px-3 py-2"
          >
            <option value="" disabled>
              — Select a product —
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Quantity
          <input
            name="quantity"
            type="number"
            min={1}
            required
            defaultValue={prefilledQuantity ?? ""}
            className="w-32 rounded-md border border-input bg-card px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Specification
          <textarea name="specification" rows={2} className="rounded-md border border-input bg-card px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Destination
            <input name="destination" className="rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Requested delivery date
            <input name="requested_delivery_date" type="date" className="rounded-md border border-input bg-card px-3 py-2" />
          </label>
        </div>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 font-medium">Send to suppliers</legend>
          {suppliers.map((s) => (
            <label key={s.id} className="flex items-center gap-2">
              <input type="checkbox" name="supplier_ids" value={s.id} />
              {s.name} <span className="text-xs capitalize text-muted-foreground">({s.status.replace(/_/g, " ")})</span>
            </label>
          ))}
          {suppliers.length === 0 && <p className="text-muted-foreground">No non-blocked suppliers yet — add one first.</p>}
        </fieldset>

        <button type="submit" className="mt-2 self-start rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
          Create RFQ
        </button>
      </form>
    </div>
  );
}
