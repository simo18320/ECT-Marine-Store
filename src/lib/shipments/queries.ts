import { createClient } from "@/lib/supabase/server";

// A single order can in principle have more than one shipment row (split shipments), but
// today's fulfillment flow only ever creates one — the most recent row is "the" shipment.
export async function getShipmentForOrder(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
