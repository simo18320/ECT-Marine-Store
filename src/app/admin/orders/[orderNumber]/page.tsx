import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/guard";
import { getOrderAdmin } from "@/lib/admin/orders";
import { overrideOrderStatus } from "@/lib/admin/order-actions";
import { generateDeliveryNote } from "@/lib/orders/delivery-actions";
import { listDeliveryNotesForOrder, estimateOrderWeightKg } from "@/lib/orders/delivery-notes";
import { GenerateDdtForm } from "@/components/admin/generate-ddt-form";
import { getShipmentForOrder } from "@/lib/shipments/queries";
import { upsertShipment } from "@/lib/shipments/actions";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

type ShipmentStatus = Database["public"]["Enums"]["shipment_status"];
const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "ordered",
  "processing",
  "ready_to_ship",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "delayed",
  "exception",
];

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  await requireStaff();
  const { orderNumber } = await params;
  const order = await getOrderAdmin(orderNumber);
  if (!order) notFound();

  const [deliveryNotes, estimatedWeightKg, shipment] = await Promise.all([
    listDeliveryNotesForOrder(order.id),
    estimateOrderWeightKg(order.id),
    getShipmentForOrder(order.id),
  ]);

  const updateStatus = overrideOrderStatus.bind(null, order.id);
  const generateDdt = generateDeliveryNote.bind(null, order.id);
  const saveShipment = upsertShipment.bind(null, order.id, order.order_number);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
        ← All orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-medium">{order.order_number}</h1>
        <form action={updateStatus} className="flex items-center gap-2">
          <select name="status" defaultValue={order.status} className="rounded-md border border-input bg-card px-3 py-1.5 text-sm capitalize">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary">
            Update
          </button>
        </form>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        {order.customer?.full_name ?? order.customer?.email} ·{" "}
        {new Date(order.created_at).toLocaleString("en-GB")}
      </p>

      <ul className="mt-8 divide-y divide-border text-sm">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between py-3">
            <span>
              {item.name_snapshot}
              <br />
              <span className="text-muted-foreground">
                {item.sku_snapshot} · {item.quantity}× {formatCurrency(item.unit_price)}
              </span>
            </span>
            <span className="font-medium">{formatCurrency(item.line_total)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{formatCurrency(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">VAT</dt>
          <dd>{formatCurrency(order.vat_total)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <dt>Total</dt>
          <dd>{formatCurrency(order.grand_total)}</dd>
        </div>
      </dl>

      {order.shipping_address && (
        <div className="mt-6">
          <h2 className="mb-1 text-sm font-semibold">Shipping address</h2>
          <p className="text-sm text-muted-foreground">
            {order.shipping_address.full_name}
            <br />
            {order.shipping_address.line1}
            {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ""}
            <br />
            {order.shipping_address.city}, {order.shipping_address.postal_code}, {order.shipping_address.country}
          </p>
        </div>
      )}

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Fulfillment</h2>
          <a
            href={`/admin/orders/${order.order_number}/label`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Shipping label
          </a>
        </div>

        <form action={saveShipment} className="mb-4 grid grid-cols-2 gap-3 rounded-md border border-border p-4">
          <label className="flex flex-col gap-1 text-sm">
            Carrier
            <input
              name="provider"
              defaultValue={shipment?.provider ?? ""}
              placeholder="e.g. BRT, GLS, DHL, Poste Italiane"
              className="rounded-md border border-input bg-card px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tracking number
            <input
              name="tracking_number"
              defaultValue={shipment?.tracking_number ?? ""}
              className="rounded-md border border-input bg-card px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Status
            <select
              name="status"
              defaultValue={shipment?.status ?? "ordered"}
              className="rounded-md border border-input bg-card px-3 py-2 capitalize"
            >
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Expected delivery
            <input
              name="expected_delivery"
              type="date"
              defaultValue={shipment?.expected_delivery ?? ""}
              className="rounded-md border border-input bg-card px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="col-span-2 mt-1 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
          >
            Save shipment
          </button>
          <p className="col-span-2 text-xs text-muted-foreground">
            Setting status to &ldquo;Shipped&rdquo; or &ldquo;In transit&rdquo; for the first time emails the
            customer their tracking info.
          </p>
        </form>

        {deliveryNotes.length > 0 && (
          <ul className="mb-3 flex flex-col gap-2">
            {deliveryNotes.map((note) => (
              <li key={note.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <span>
                  DDT {note.number}/{note.year}
                  <span className="ml-2 text-muted-foreground">
                    {new Date(note.issued_at).toLocaleDateString("en-GB")}
                  </span>
                </span>
                <a
                  href={`/admin/delivery-notes/${note.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View / print
                </a>
              </li>
            ))}
          </ul>
        )}

        <GenerateDdtForm action={generateDdt} defaultWeightKg={estimatedWeightKg} />
      </div>

      {order.invoices.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-1 text-sm font-semibold">Fiscal document</h2>
          <ul className="text-sm text-muted-foreground">
            {order.invoices.map((inv) => (
              <li key={inv.id}>
                <span className="capitalize">{inv.document_type}</span> —{" "}
                <span
                  className={
                    inv.status === "issued"
                      ? "text-status-good"
                      : inv.status === "failed"
                        ? "text-status-critical"
                        : "text-status-warning"
                  }
                >
                  {inv.status}
                </span>
                {inv.error_message && <span className="ml-2">({inv.error_message})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {order.payments.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-1 text-sm font-semibold">Payments</h2>
          <ul className="text-sm text-muted-foreground">
            {order.payments.map((p) => (
              <li key={p.id}>
                {p.stripe_payment_intent_id} — {p.status} — {formatCurrency(p.amount)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
