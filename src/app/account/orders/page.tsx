import Link from "next/link";
import { redirect } from "next/navigation";
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

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/orders");

  const { data: orders } = await supabase
    .from("orders")
    .select("order_number, status, grand_total, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="mb-6 text-3xl font-medium">Orders</h1>

      {!orders || orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No orders yet.{" "}
          <Link href="/" className="font-medium text-primary hover:underline">
            Start shopping
          </Link>
          .
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {orders.map((order) => (
            <li key={order.order_number} className="py-4">
              <Link
                href={`/account/orders/${order.order_number}`}
                className="flex items-center justify-between text-sm hover:text-primary"
              >
                <span>
                  <span className="font-medium">{order.order_number}</span>
                  <br />
                  <span className="text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-medium">{formatCurrency(order.grand_total)}</span>
                  <br />
                  <span className="text-muted-foreground">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/account" className="mt-8 inline-block text-sm text-muted-foreground hover:text-foreground">
        ← Back to account
      </Link>
    </main>
  );
}
