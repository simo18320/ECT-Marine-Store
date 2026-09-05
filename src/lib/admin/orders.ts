import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Enums"]["order_status"];

export async function listOrdersAdmin(statusFilter?: OrderStatus) {
  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, status, grand_total, created_at, customer:profiles(email, full_name)")
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data } = await query;
  return data ?? [];
}

export async function getOrderAdmin(orderNumber: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "*, customer:profiles(email, full_name), order_items(*), payments(*), shipping_address:customer_addresses!orders_shipping_address_id_fkey(*)",
    )
    .eq("order_number", orderNumber)
    .maybeSingle();
  return data;
}
