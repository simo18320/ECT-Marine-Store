import { requireStaff } from "@/lib/admin/guard";
import { listActiveProductsForSelect, listInventory, listRecentMovements } from "@/lib/admin/inventory";
import { recordMovement, updateReorderPoint } from "@/lib/admin/inventory-actions";
import { getStockStatus, getAvailableStock, STOCK_STATUS_LABEL } from "@/lib/inventory/rules";

export default async function AdminInventoryPage() {
  await requireStaff();
  const [inventory, products, movements] = await Promise.all([
    listInventory(),
    listActiveProductsForSelect(),
    listRecentMovements(),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Inventory</h1>

      <section className="mb-10 rounded-md border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold">Record a movement</h2>
        <form action={recordMovement} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Product
            <select name="product_id" required className="min-w-48 rounded-md border border-input bg-card px-3 py-2">
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Type
            <select name="movement_type" className="rounded-md border border-input bg-card px-3 py-2">
              <option value="adjustment">Adjustment</option>
              <option value="damage">Damage</option>
              <option value="transfer">Transfer</option>
              <option value="purchase">Purchase</option>
              <option value="return">Return</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Quantity
            <input
              name="quantity"
              type="number"
              min={1}
              required
              className="w-24 rounded-md border border-input bg-card px-3 py-2"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Note
            <input name="note" className="rounded-md border border-input bg-card px-3 py-2" />
          </label>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Record
          </button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          Damage decreases stock; adjustment is signed as entered (business-rules.md §2). Sale
          movements are written automatically by the Stripe webhook, not entered here.
        </p>
      </section>

      <div className="mb-10 overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2 text-right">Current</th>
              <th className="px-4 py-2 text-right">Reserved</th>
              <th className="px-4 py-2 text-right">Available</th>
              <th className="px-4 py-2">Reorder point / qty</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {inventory.map((row) => {
              const status = getStockStatus(row);
              return (
                <tr key={row.id}>
                  <td className="px-4 py-2">
                    {row.product?.name}
                    <div className="text-xs text-muted-foreground">{row.product?.sku}</div>
                  </td>
                  <td className="px-4 py-2 text-right">{row.current_stock}</td>
                  <td className="px-4 py-2 text-right">{row.reserved_stock}</td>
                  <td className="px-4 py-2 text-right">{getAvailableStock(row)}</td>
                  <td className="px-4 py-2">
                    <form action={updateReorderPoint} className="flex items-center gap-1">
                      <input type="hidden" name="product_id" value={row.product_id} />
                      <input
                        name="reorder_point"
                        type="number"
                        defaultValue={row.reorder_point}
                        className="w-16 rounded border border-input bg-card px-2 py-1 text-xs"
                      />
                      <span className="text-muted-foreground">/</span>
                      <input
                        name="reorder_quantity"
                        type="number"
                        defaultValue={row.reorder_quantity}
                        className="w-16 rounded border border-input bg-card px-2 py-1 text-xs"
                      />
                      <button type="submit" className="text-xs text-primary hover:underline">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        status === "out_of_stock"
                          ? "text-status-critical"
                          : status === "low_stock"
                            ? "text-status-warning"
                            : "text-status-good"
                      }
                    >
                      {STOCK_STATUS_LABEL[status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Recent movements</h2>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {movements.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(m.created_at).toLocaleString("en-GB")}
                </td>
                <td className="px-4 py-2">{m.product?.name ?? "—"}</td>
                <td className="px-4 py-2 capitalize">{m.movement_type}</td>
                <td className="px-4 py-2 text-right">{m.quantity}</td>
                <td className="px-4 py-2 text-muted-foreground">{m.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
