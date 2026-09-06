import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/guard";
import { getCustomerWithOrders } from "@/lib/admin/customers";
import { formatCurrency } from "@/lib/utils";

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const result = await getCustomerWithOrders(id);
  if (!result) notFound();
  const { profile, orders } = result;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/customers" className="text-sm text-muted-foreground hover:text-foreground">
        ← All customers
      </Link>

      <h1 className="mt-4 text-3xl font-medium">{profile.full_name ?? profile.email}</h1>
      <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="text-muted-foreground">Email</dt>
        <dd>{profile.email}</dd>
        <dt className="text-muted-foreground">Account type</dt>
        <dd className="capitalize">{profile.account_type}</dd>
        <dt className="text-muted-foreground">Joined</dt>
        <dd>{new Date(profile.created_at).toLocaleDateString("en-GB")}</dd>
      </dl>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Orders</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {orders.map((order) => (
            <li key={order.order_number} className="flex items-center justify-between py-3">
              <Link href={`/admin/orders/${order.order_number}`} className="text-primary hover:underline">
                {order.order_number}
              </Link>
              <span className="capitalize text-muted-foreground">{order.status}</span>
              <span className="font-medium">{formatCurrency(order.grand_total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
