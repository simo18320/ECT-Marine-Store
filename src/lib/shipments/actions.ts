"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { sendShipmentNotificationEmail } from "@/lib/email/shipment-notification";
import type { Database } from "@/types/database";

type ShipmentStatus = Database["public"]["Enums"]["shipment_status"];

const NOTIFY_ON_STATUSES: ShipmentStatus[] = ["shipped", "in_transit"];

/**
 * Creates or updates the (single, for now) shipment row for an order. Notifies the customer by
 * email the first time the status reaches "shipped"/"in_transit" — re-saving the same shipment
 * afterward (e.g. just updating expected_delivery) does not re-send it.
 */
export async function upsertShipment(orderId: string, orderNumber: string, formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();

  const provider = (formData.get("provider") as string)?.trim() || null;
  const trackingNumber = (formData.get("tracking_number") as string)?.trim() || null;
  const status = formData.get("status") as ShipmentStatus;
  const expectedDelivery = (formData.get("expected_delivery") as string) || null;

  const { data: existing } = await supabase
    .from("shipments")
    .select("id, status")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fields = { provider, tracking_number: trackingNumber, status, expected_delivery: expectedDelivery };

  if (existing) {
    await supabase.from("shipments").update(fields).eq("id", existing.id);
  } else {
    await supabase.from("shipments").insert({ order_id: orderId, ...fields });
  }

  await supabase.from("audit_logs").insert({
    actor_id: staff.userId,
    action: "shipment_upsert",
    entity_type: "shipments",
    entity_id: existing?.id ?? orderId,
    before: existing ? { status: existing.status } : null,
    after: fields,
  });

  const shouldNotify = NOTIFY_ON_STATUSES.includes(status) && existing?.status !== status;
  if (shouldNotify) {
    const { data: order } = await supabase
      .from("orders")
      .select("customer:profiles(email)")
      .eq("id", orderId)
      .maybeSingle();
    if (order?.customer?.email) {
      await sendShipmentNotificationEmail({
        toEmail: order.customer.email,
        orderNumber,
        provider,
        trackingNumber,
        expectedDelivery,
      });
    }
  }

  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath(`/account/orders/${orderNumber}`);
}
