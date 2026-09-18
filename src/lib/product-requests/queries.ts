import { createClient } from "@/lib/supabase/server";

// Admin-facing: every request across every product, staff-only per the table's RLS policy.
export async function listProductAvailabilityRequests() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("product_availability_requests")
    .select("*, product:products(name, sku, slug)")
    .order("created_at", { ascending: false });
  return data ?? [];
}
