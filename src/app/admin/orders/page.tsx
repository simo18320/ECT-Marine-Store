import Link from "next/link";
import { requireStaff } from "@/lib/admin/guard";
import { listOrdersAdmin } from "@/lib/admin/orders";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const STATUSES: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireStaff();
  const { status } = await searchParams;
  const statusFilter = STATUSES.find((s) => s === status);
  const orders = await listOrdersAdmin(statusFilter);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Orders</h1>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/orders"
          className={`rounded-full px-3 py-1 ${!status ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full px-3 py-1 capitalize ${status === s ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-2">
                  <Link href={`/admin/orders/${order.order_number}`} className="font-medium text-primary hover:underline">
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-2">{order.customer?.full_name ?? order.customer?.email ?? "—"}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-2 capitalize">{order.status}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(order.grand_total)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
