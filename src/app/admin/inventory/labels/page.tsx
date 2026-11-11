import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { generateQrDataUrl } from "@/lib/qr/generate";
import { PrintButton } from "@/components/admin/print-button";
import { LabelFormatToggle } from "@/components/admin/label-format-toggle";

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
  searchParams: Promise<{ format?: string; copies?: string }>;
}) {
  await requireStaff();
  const { format, copies } = await searchParams;
  // Default: one label per product (stick it on the item, the bin or the shelf). "units" = one per piece in stock.
  const perUnit = copies === "units";
  const hasExplicitFormat = format !== undefined;
  const isBrother = format === "brother";
  const products = await listProductsForLabels();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // The QR holds a short URL (/i/<sku>): fewer modules, so it stays readable by a phone camera on a small label.
  const qrFor = (sku: string) => generateQrDataUrl(`${appUrl}/i/${sku}`);
  const labels = await Promise.all(
    products.flatMap((product) => {
      const quantity = perUnit ? (product.inventory?.current_stock ?? 0) : 1;
      if (quantity <= 0) return [];
      return Array.from({ length: quantity }, async () => ({ product, qrDataUrl: await qrFor(product.sku) }));
    }),
  );

  const productsWithNoStock = perUnit ? products.filter((p) => (p.inventory?.current_stock ?? 0) <= 0) : [];

  return (
    <div className="bg-white p-8 text-black print:p-0">
      {isBrother && <style>{`@media print { @page { size: 25mm 25mm; margin: 0; } }`}</style>}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin/inventory" className="text-sm text-gray-600 hover:text-black">
          ← Torna all&rsquo;inventario
        </Link>
        <div className="flex items-center gap-4">
          <LabelFormatToggle isBrother={isBrother} hasExplicitFormat={hasExplicitFormat} copies={perUnit ? "units" : "type"} />
          <a
            href={`/admin/inventory/labels/export${perUnit ? "?copies=units" : ""}`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Esporta CSV per P-touch Editor
          </a>
          <PrintButton label="Stampa etichette" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm print:hidden">
        <span className="text-gray-500">Etichette:</span>
        <Link
          href={`/admin/inventory/labels${isBrother ? "?format=brother" : ""}`}
          className={!perUnit ? "font-semibold text-black" : "text-gray-500 hover:text-black"}
        >
          Una per prodotto ({products.length})
        </Link>
        <span className="text-gray-300">|</span>
        <Link
          href={`/admin/inventory/labels?${isBrother ? "format=brother&" : ""}copies=units`}
          className={perUnit ? "font-semibold text-black" : "text-gray-500 hover:text-black"}
        >
          Una per ogni pezzo in scorta
        </Link>
        <span className="text-xs text-gray-500">
          — il QR apre sul telefono la scheda dell&rsquo;articolo con giacenza e pulsanti per scaricare o caricare.
        </span>
      </div>

      {isBrother && (
        <p className="mb-4 text-xs text-gray-500 print:hidden">
          Nella finestra di stampa scegli la Brother VC-500W come stampante e imposta la
          dimensione pagina/etichetta su 25×25mm (o il rotolo continuo da 25mm che hai caricato)
          — ogni etichetta esce già separata dalla successiva.
        </p>
      )}

      <p className="mb-4 text-xs text-gray-500 print:hidden">
        Per stampare da P-touch Editor invece del browser: scarica il CSV, poi in P-touch Editor
        crea/apri il template etichetta, vai su &ldquo;Database&rdquo; → &ldquo;Connetti
        database&rdquo; e seleziona il file — collega il campo QR del template alla colonna
        &ldquo;QR&rdquo; e gli altri campi testo a SKU/Nome/Dimensione/Micron/Prezzo. C&rsquo;è
        già una riga per ogni pezzo in scorta, quindi la stampa in serie produce il numero giusto
        di etichette senza doverlo impostare a mano.
      </p>

      {labels.length === 0 ? (
        <p className="text-sm text-gray-600 print:hidden">
          Nessuna etichetta da stampare: con &ldquo;una per ogni pezzo&rdquo; servono scorte registrate in Admin →
          Inventory. Scegli &ldquo;Una per prodotto&rdquo; per stampare un QR per ogni prodotto attivo.
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
