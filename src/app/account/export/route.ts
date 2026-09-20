import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GDPR art. 15/20: a machine-readable copy of the signed-in user's own data. Everything except
// product_availability_requests is read with the user's own session, so RLS decides what they
// can see; that one table is staff-read-only by design, so it is read by customer id instead.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const [profile, addresses, orders, yachts, conversations, withdrawals, privacy] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("customer_addresses").select("*").eq("customer_id", user.id),
    supabase.from("orders").select("*, order_items(*), shipments(*)").eq("customer_id", user.id),
    supabase.from("yachts").select("*, equipment(*), filters(*), service_requests(*), water_analysis(*)"),
    supabase.from("ai_conversations").select("*, ai_messages(*)").eq("profile_id", user.id),
    supabase.from("withdrawal_requests").select("*").eq("customer_id", user.id),
    supabase.from("privacy_requests").select("*").eq("customer_id", user.id),
  ]);
  const productRequests = await createAdminClient()
    .from("product_availability_requests")
    .select("*")
    .eq("customer_id", user.id);

  const body = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    addresses: addresses.data,
    orders: orders.data,
    yachts: yachts.data,
    ai_conversations: conversations.data,
    product_requests: productRequests.data,
    withdrawal_requests: withdrawals.data,
    privacy_requests: privacy.data,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="my-ect-data.json"',
    },
  });
}
