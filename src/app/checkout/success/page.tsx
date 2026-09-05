import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { ClearCartOnMount } from "@/components/cart/clear-cart-on-mount";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const supabase = await createClient();

  const { data: order } = orderNumber
    ? await supabase
        .from("orders")
        .select("order_number, status, grand_total, order_items(name_snapshot, quantity, line_total)")
        .eq("order_number", orderNumber)
        .maybeSingle()
    : { data: null };

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-16 text-center">
      <ClearCartOnMount />
      {!order ? (
        <>
          <h1 className="text-2xl font-semibold">Order not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&rsquo;t find that order. If you just paid, check{" "}
            <Link href="/account/orders" className="text-primary hover:underline">
              your orders
            </Link>
            .
          </p>
        </>
      ) : order.status === "paid" ? (
        <>
          <h1 className="text-2xl font-semibold text-status-good">Payment confirmed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Order <strong>{order.order_number}</strong> — {formatCurrency(order.grand_total)}
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold">Payment processing</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Order <strong>{order.order_number}</strong> is being confirmed. This page will update
            once Stripe confirms the payment — refresh in a moment, or check{" "}
            <Link href="/account/orders" className="text-primary hover:underline">
              your orders
            </Link>{" "}
            shortly.
          </p>
        </>
      )}

      {order && order.order_items.length > 0 && (
        <ul className="mt-8 divide-y divide-border text-left text-sm">
          {order.order_items.map((item, i) => (
            <li key={i} className="flex justify-between py-2">
              <span>
                {item.quantity}× {item.name_snapshot}
              </span>
              <span>{formatCurrency(item.line_total)}</span>
            </li>
          ))}
        </ul>
      )}

      <Link href="/" className="mt-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Continue shopping
      </Link>
    </main>
  );
}
