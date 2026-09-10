import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { PrintButton } from "@/components/admin/print-button";

async function listProductsForLabels() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, sku, name, selling_price, technical_specs")
    .eq("is_active", true)
    .order("sku");
  return data ?? [];
}

function specSummary(specs: unknown): string {
  const s = (specs as Record<string, unknown>) ?? {};
  const parts: string[] = [];
  if (typeof s.size === "string") parts.push(s.size);
  if (s.micron_rating != null) parts.push(`${s.micron_rating} micron`);
  return parts.join(" · ");
}

export default async function InventoryLabelsPage() {
  await requireStaff();
  const products = await listProductsForLabels();

  return (
    <div className="bg-white p-8 text-black print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin/inventory" className="text-sm text-gray-600 hover:text-black">
          ← Torna all&rsquo;inventario
        </Link>
        <PrintButton label="Stampa etichette" />
      </div>

      <div className="grid grid-cols-3 gap-3 print:grid-cols-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-col justify-between rounded border border-black p-3"
            style={{ breakInside: "avoid" }}
          >
            <div>
              <p className="font-mono text-lg font-bold leading-tight">{product.sku}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-snug">{product.name}</p>
            </div>
            <div className="mt-2 flex items-end justify-between border-t border-gray-300 pt-1">
              <span className="text-xs text-gray-600">{specSummary(product.technical_specs)}</span>
              <span className="text-sm font-semibold">{formatCurrency(product.selling_price)}</span>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="col-span-3 text-sm text-gray-500">Nessun prodotto attivo.</p>}
      </div>
    </div>
  );
}
