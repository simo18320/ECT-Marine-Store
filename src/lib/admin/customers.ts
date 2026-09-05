import { createClient } from "@/lib/supabase/server";

const STAFF_ROLES = ["ect_operator", "ect_admin", "super_admin"];

export async function listCustomers() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, account_type, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).filter((p) => !STAFF_ROLES.includes(p.role));
}

export async function getCustomerWithOrders(id: string) {
  const supabase = await createClient();
  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("orders")
      .select("order_number, status, grand_total, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!profile) return null;
  return { profile, orders: orders ?? [] };
}
