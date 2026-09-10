import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { generateQrDataUrl } from "@/lib/qr/generate";
import { PrintButton } from "@/components/admin/print-button";

async function listProductsForLabels() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, sku, name, selling_price, technical_specs, inventory(current_stock)")
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

export default async function InventoryLabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ format?: string }>;
}) {
  await requireStaff();
  const { format } = await searchParams;
  const isBrother = format === "brother";
  const products = await listProductsForLabels();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // One label per physical unit in stock, not one per product — a product with 5 in inventory
  // prints 5 identical copies of its label, ready to cut (A4) or already cut by the printer
  // (Brother) and stuck on each unit.
  const labels = await Promise.all(
    products.flatMap((product) => {
      const quantity = product.inventory?.current_stock ?? 0;
      if (quantity <= 0) return [];
      return Array.from({ length: quantity }, async () => ({
        product,
        qrDataUrl: await generateQrDataUrl(`${appUrl}/admin/products/${product.id}/edit`),
      }));
    }),
  );

  const productsWithNoStock = products.filter((p) => (p.inventory?.current_stock ?? 0) <= 0);

  return (
    <div className="bg-white p-8 text-black print:p-0">
      {isBrother && <style>{`@media print { @page { size: 25mm 25mm; margin: 0; } }`}</style>}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/inventory" className="text-sm text-gray-600 hover:text-black">
          ← Torna all&rsquo;inventario
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 text-sm">
            <Link
              href="/admin/inventory/labels"
              className={!isBrother ? "font-semibold text-black" : "text-gray-500 hover:text-black"}
            >
              Foglio A4
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/admin/inventory/labels?format=brother"
              className={isBrother ? "font-semibold text-black" : "text-gray-500 hover:text-black"}
            >
              Brother VC-500W (rotolo 25mm)
            </Link>
          </div>
          <PrintButton label="Stampa etichette" />
        </div>
      </div>

      {isBrother && (
        <p className="mb-4 text-xs text-gray-500 print:hidden">
          Nella finestra di stampa scegli la Brother VC-500W come stampante e imposta la
          dimensione pagina/etichetta su 25×25mm (o il rotolo continuo da 25mm che hai caricato)
          — ogni etichetta esce già separata dalla successiva.
        </p>
      )}

      {labels.length === 0 ? (
        <p className="text-sm text-gray-600 print:hidden">
          Nessun prodotto ha scorte registrate in Inventory, quindi non c&rsquo;è nulla da
          etichettare — registra prima le quantità reali in Admin → Inventory, poi torna qui.
        </p>
      ) : isBrother ? (
        <div className="flex flex-col items-center gap-4 print:block print:gap-0">
          {labels.map(({ product, qrDataUrl }, i) => (
            <div
              key={`${product.id}-${i}`}
              className="flex flex-col items-center justify-center gap-0.5 border border-black p-1 text-center print:break-after-page print:border-0"
              style={{ width: "25mm", height: "25mm" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="" style={{ width: "14mm", height: "14mm" }} />
              <p className="font-mono text-[10px] font-bold leading-tight">{product.sku}</p>
              <p className="text-[7px] leading-tight text-gray-600">{specSummary(product.technical_specs)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 print:grid-cols-3">
          {labels.map(({ product, qrDataUrl }, i) => (
            <div
              key={`${product.id}-${i}`}
              className="flex items-center gap-2 rounded border border-black p-3"
              style={{ breakInside: "avoid" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="" className="h-16 w-16 shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-base font-bold leading-tight">{product.sku}</p>
                <p className="line-clamp-2 text-xs leading-snug">{product.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-gray-600">{specSummary(product.technical_specs)}</span>
                  <span className="text-xs font-semibold">{formatCurrency(product.selling_price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {productsWithNoStock.length > 0 && (
        <div className="mt-8 print:hidden">
          <p className="mb-2 text-xs text-gray-500">
            {productsWithNoStock.length} prodotti attivi senza scorte registrate (0 etichette
            stampate per loro):
          </p>
          <p className="text-xs text-gray-500">{productsWithNoStock.map((p) => p.sku).join(", ")}</p>
        </div>
      )}
    </div>
  );
}
