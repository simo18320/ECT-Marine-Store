"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "./guard";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type OrderStatus = Database["public"]["Enums"]["order_status"];

/**
 * Manual admin status override. Payment status itself is still only ever written by the
 * Stripe webhook (business-rules.md §8) — this is for fulfillment states downstream of
 * payment (processing/shipped/delivered) or admin-initiated cancel/refund, and every change
 * is captured in audit_logs with before/after (security.md §6).
 */
export async function overrideOrderStatus(orderId: string, formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();
  const newStatus = formData.get("status") as OrderStatus;

  const { data: before } = await supabase.from("orders").select("status").eq("id", orderId).single();
  if (!before) throw new Error("Order not found.");

  await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);

  await supabase.from("audit_logs").insert({
    actor_id: staff.userId,
    action: "order_status_override",
    entity_type: "orders",
    entity_id: orderId,
    before: { status: before.status },
    after: { status: newStatus },
  });

  revalidatePath("/admin/orders");
}
