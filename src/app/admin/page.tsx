import Link from "next/link";
import { getDashboardStats } from "@/lib/admin/dashboard-queries";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Orders today", value: stats.ordersToday, href: "/admin/orders" },
    { label: "Pending payment", value: stats.pendingOrders, href: "/admin/orders" },
    { label: "Revenue (paid orders)", value: formatCurrency(stats.totalRevenue), href: "/admin/orders" },
    { label: "Active products", value: stats.activeProducts, href: "/admin/products" },
    { label: "Low stock", value: stats.lowStockCount, href: "/admin/inventory" },
    { label: "Out of stock", value: stats.outOfStockCount, href: "/admin/inventory" },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-border bg-card p-5 shadow-sm transition hover:border-primary"
          >
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
