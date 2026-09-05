import { createClient } from "@/lib/supabase/server";

export async function listInventory() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory")
    .select("*, product:products(sku, name)")
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function listActiveProductsForSelect() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, sku, name")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function listRecentMovements(limit = 30) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory_movements")
    .select("*, product:products(sku, name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
