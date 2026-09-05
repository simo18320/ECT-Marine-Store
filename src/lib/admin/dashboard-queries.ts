import { createClient } from "@/lib/supabase/server";
import { getStockStatus } from "@/lib/inventory/rules";

export interface DashboardStats {
  ordersToday: number;
  pendingOrders: number;
  totalRevenue: number;
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [{ count: ordersToday }, { count: pendingOrders }, { data: paidOrders }, { count: activeProducts }, { data: inventory }] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startOfToday.toISOString()),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("grand_total").eq("status", "paid"),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("inventory").select("current_stock, reserved_stock, reorder_point"),
    ]);

  const totalRevenue = (paidOrders ?? []).reduce((sum, o) => sum + o.grand_total, 0);
  const statuses = (inventory ?? []).map((i) => getStockStatus(i));

  return {
    ordersToday: ordersToday ?? 0,
    pendingOrders: pendingOrders ?? 0,
    totalRevenue,
    activeProducts: activeProducts ?? 0,
    lowStockCount: statuses.filter((s) => s === "low_stock").length,
    outOfStockCount: statuses.filter((s) => s === "out_of_stock").length,
  };
}
