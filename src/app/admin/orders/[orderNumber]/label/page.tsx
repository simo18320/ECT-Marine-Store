import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/guard";
import { getOrderAdmin } from "@/lib/admin/orders";
import { listDeliveryNotesForOrder } from "@/lib/orders/delivery-notes";
import { COMPANY } from "@/lib/company";
import { PrintButton } from "@/components/admin/print-button";

export default async function ShippingLabelPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  await requireStaff();
  const { orderNumber } = await params;
  const order = await getOrderAdmin(orderNumber);
  if (!order) notFound();

  const notes = await listDeliveryNotesForOrder(order.id);
  const latestNote = notes[0] ?? null;
  const address = order.shipping_address;

  return (
    <div className="mx-auto max-w-md bg-white p-8 text-black print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/admin/orders/${order.order_number}`} className="text-sm text-gray-600 hover:text-black">
          ← Torna all&rsquo;ordine
        </Link>
        <PrintButton label="Stampa etichetta" />
      </div>

      <p className="mb-4 text-xs text-gray-500 print:hidden">
        Etichetta interna di imballo — non è un&rsquo;etichetta corriere con tracking (nessun
        account corriere collegato). Se vuoi il tracking reale, dimmi con quale corriere lavori
        (BRT, GLS, Poste, DHL, ...) e collego la loro API.
      </p>

      <div className="border-2 border-black p-5">
        <p className="mb-4 text-xs">
          Mittente: {COMPANY.legalName} — {COMPANY.addressLine1}, {COMPANY.addressLine2}
        </p>

        <div className="mb-4 border-t-2 border-black pt-3">
          <p className="text-xs font-bold uppercase text-gray-500">Destinatario</p>
          {address ? (
            <p className="text-lg font-semibold leading-snug">
              {address.full_name}
              <br />
              <span className="text-base font-normal">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.postal_code} {address.city}, {address.country}
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-500">Nessun indirizzo registrato.</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t-2 border-black pt-3 text-sm">
          <span>Ordine {order.order_number}</span>
          {latestNote && (
            <span>
              DDT {latestNote.number}/{latestNote.year}
            </span>
          )}
        </div>
        {latestNote && (
          <p className="mt-1 text-sm">
            {latestNote.package_count} collo/i
            {latestNote.total_weight_kg ? ` — ${latestNote.total_weight_kg} kg` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
