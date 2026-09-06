import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account/orders/${orderNumber}`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_number, status, subtotal, vat_total, shipping_total, grand_total, created_at, order_items(name_snapshot, sku_snapshot, quantity, unit_price, line_total)",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (!order) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <Link href="/account/orders" className="text-sm text-muted-foreground hover:text-foreground">
        ← All orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-3xl font-medium">{order.order_number}</h1>
        <span className="text-sm font-medium">{STATUS_LABEL[order.status] ?? order.status}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed{" "}
        {new Date(order.created_at).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <ul className="mt-8 divide-y divide-border text-sm">
        {order.order_items.map((item, i) => (
          <li key={i} className="flex justify-between py-3">
            <span>
              <span className="font-medium">{item.name_snapshot}</span>
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
        {order.shipping_total > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{formatCurrency(order.shipping_total)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 font-semibold">
          <dt>Total</dt>
          <dd>{formatCurrency(order.grand_total)}</dd>
        </div>
      </dl>
    </main>
  );
}
