import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/guard";
import { getDeliveryNote } from "@/lib/orders/delivery-notes";
import { COMPANY } from "@/lib/company";
import { formatCurrency } from "@/lib/utils";
import { PrintButton } from "@/components/admin/print-button";

export default async function DeliveryNotePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const note = await getDeliveryNote(id);
  if (!note || !note.order) notFound();

  const order = note.order;
  const address = order.shipping_address;

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-black print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-black">
          ← Torna agli ordini
        </Link>
        <PrintButton label="Stampa DDT" />
      </div>

      <header className="mb-8 flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <h1 className="text-xl font-bold">DOCUMENTO DI TRASPORTO</h1>
          <p className="text-sm">
            N. {note.number}/{note.year} del {new Date(note.issued_at).toLocaleDateString("it-IT")}
          </p>
        </div>
        <p className="text-sm text-gray-600">Ordine {order.order_number}</p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-8">
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase text-gray-500">Mittente</h2>
          <p className="text-sm">
            {COMPANY.legalName}
            <br />
            {COMPANY.addressLine1}
            <br />
            {COMPANY.addressLine2}
            <br />
            P.IVA {COMPANY.vatNumber}
          </p>
        </div>
        <div>
          <h2 className="mb-1 text-xs font-bold uppercase text-gray-500">Destinatario</h2>
          {address ? (
            <p className="text-sm">
              {address.full_name}
              <br />
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.postal_code} {address.city}, {address.country}
              {address.phone ? (
                <>
                  <br />
                  Tel. {address.phone}
                </>
              ) : null}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Nessun indirizzo di spedizione registrato.</p>
          )}
        </div>
      </div>

      <table className="mb-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-black text-left">
            <th className="py-1 pr-2">Codice</th>
            <th className="py-1 pr-2">Descrizione</th>
            <th className="py-1 pr-2 text-right">Quantità</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item) => (
            <tr key={item.id} className="border-b border-gray-300">
              <td className="py-1.5 pr-2">{item.sku_snapshot}</td>
              <td className="py-1.5 pr-2">{item.name_snapshot}</td>
              <td className="py-1.5 pr-2 text-right">{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-8 grid grid-cols-2 gap-8 text-sm">
        <div>
          <p>
            <span className="font-semibold">Causale del trasporto:</span> {note.causale}
          </p>
          <p>
            <span className="font-semibold">Aspetto dei beni:</span> {note.package_count} collo/i
            {note.total_weight_kg ? ` — peso totale ${note.total_weight_kg} kg` : ""}
          </p>
          {note.carrier_name && (
            <p>
              <span className="font-semibold">Vettore:</span> {note.carrier_name}
            </p>
          )}
          {note.notes && (
            <p>
              <span className="font-semibold">Note:</span> {note.notes}
            </p>
          )}
        </div>
        <div>
          <p className="text-gray-500">
            Documento emesso ai sensi del D.P.R. 472/1996. Valore dei beni indicato a soli fini
            assicurativi/doganali: {formatCurrency(order.subtotal)}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 pt-12 text-sm">
        <div className="border-t border-black pt-1">Firma del mittente</div>
        <div className="border-t border-black pt-1">Firma del destinatario</div>
      </div>
    </div>
  );
}
