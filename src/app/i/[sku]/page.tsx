import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { InventoryMovementForm } from "@/components/admin/inventory-movement-form";
import { getStockStatus, STOCK_STATUS_LABEL } from "@/lib/inventory/rules";
import { storedMovementDelta } from "@/lib/inventory/movements";

// Where the QR label on a physical item lands: a phone-sized page with the stock and the quick actions.
// The URL is deliberately short (/i/<sku>) so the QR code stays small and easy to scan on a tiny label.
export default async function InventoryItemPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku: rawSku } = await params;
  const sku = decodeURIComponent(rawSku);
  await requireStaff(`/i/${rawSku}`);

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, sku, name, is_active, technical_specs, inventory(current_stock, reserved_stock, reorder_point)")
    .eq("sku", sku)
    .maybeSingle();
  if (!product) notFound();

  const inventory = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory;
  const stock = inventory?.current_stock ?? 0;
  const status = getStockStatus(inventory ? { current_stock: stock, reserved_stock: inventory.reserved_stock, reorder_point: inventory.reorder_point } : null);

  const { data: movements } = await supabase
    .from("inventory_movements")
    .select("id, movement_type, quantity, note, created_at")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const specs = (product.technical_specs as Record<string, unknown>) ?? {};
  const detail = [typeof specs.size === "string" ? specs.size : null, specs.micron_rating != null ? `${specs.micron_rating} micron` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <p className="font-mono text-sm text-muted-foreground">{product.sku}</p>
      <h1 className="mt-1 text-2xl font-medium leading-tight">{product.name}</h1>
      {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}
      {!product.is_active && <p className="mt-2 text-sm text-status-warning">This product is not active in the shop.</p>}

      <div className="mt-5 rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">In stock</p>
        <p className={`font-heading text-6xl font-medium ${stock < 0 ? "text-status-critical" : ""}`}>{stock}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {stock < 0 ? "Negative: sold and not yet received — reorder from the supplier" : STOCK_STATUS_LABEL[status]}
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold">Record a movement</h2>
        <InventoryMovementForm products={[{ id: product.id, sku: product.sku, name: product.name }]} lockedProduct />
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold">Latest movements</h2>
        {(movements ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No movements recorded yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {(movements ?? []).map((m) => {
              const d = storedMovementDelta(m.movement_type, m.quantity);
              return (
                <li key={m.id} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="capitalize">{m.movement_type}</span>
                    {m.note && <span className="block truncate text-xs text-muted-foreground">{m.note}</span>}
                    <span className="block text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("en-GB")}</span>
                  </span>
                  <span className={`shrink-0 font-medium ${d < 0 ? "text-status-critical" : "text-status-good"}`}>{d > 0 ? `+${d}` : `−${Math.abs(d)}`}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-6 text-center text-sm">
        <Link href={`/admin/products/${product.id}/edit`} className="text-primary hover:underline">
          Edit product
        </Link>
        <span className="mx-2 text-muted-foreground">·</span>
        <Link href="/admin/inventory" className="text-primary hover:underline">
          All inventory
        </Link>
      </p>
    </main>
  );
}
