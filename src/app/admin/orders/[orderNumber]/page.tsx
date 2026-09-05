import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/guard";
import { getOrderAdmin } from "@/lib/admin/orders";
import { overrideOrderStatus } from "@/lib/admin/order-actions";
import { formatCurrency } from "@/lib/utils";

const STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  await requireStaff();
  const { orderNumber } = await params;
  const order = await getOrderAdmin(orderNumber);
  if (!order) notFound();

  const updateStatus = overrideOrderStatus.bind(null, order.id);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
        ← All orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{order.order_number}</h1>
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
