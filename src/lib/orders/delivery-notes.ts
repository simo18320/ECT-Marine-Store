import { createClient } from "@/lib/supabase/server";

export async function listDeliveryNotesForOrder(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_notes")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getDeliveryNote(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("delivery_notes")
    .select(
      "*, order:orders(*, customer:profiles(email, full_name), order_items(*), shipping_address:customer_addresses!orders_shipping_address_id_fkey(*))",
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Sums product.weight_kg × quantity across an order's lines — a starting estimate for the
 * DDT/label weight field, not authoritative (packaging isn't accounted for, and a product's
 * weight may have changed since the order was placed), so the form still lets the admin
 * override it before the document is generated. */
export async function estimateOrderWeightKg(orderId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data: items } = await supabase.from("order_items").select("product_id, quantity").eq("order_id", orderId);
  if (!items || items.length === 0) return null;

  const { data: products } = await supabase
    .from("products")
    .select("id, weight_kg")
    .in(
      "id",
      items.map((i) => i.product_id),
    );
  const weightById = new Map((products ?? []).map((p) => [p.id, p.weight_kg]));

  let total = 0;
  let anyKnown = false;
  for (const item of items) {
    const weight = weightById.get(item.product_id);
    if (weight != null) {
      total += weight * item.quantity;
      anyKnown = true;
    }
  }
  return anyKnown ? Math.round(total * 1000) / 1000 : null;
}
