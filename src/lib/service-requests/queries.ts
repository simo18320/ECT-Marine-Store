import { createClient } from "@/lib/supabase/server";

export async function listServiceRequestsForYacht(yachtId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select("*")
    .eq("yacht_id", yachtId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// Admin-facing: every request across every yacht, staff-only per service_requests' RLS policy.
export async function listServiceRequests() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select("*, yacht:yachts(name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}
