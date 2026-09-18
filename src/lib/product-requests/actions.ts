"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendProductRequestNotification } from "@/lib/email/product-request-notification";
import type { Database } from "@/types/database";

export type AvailabilityRequestState = { error?: string; success?: boolean };

type AvailabilityRequestStatus = Database["public"]["Tables"]["product_availability_requests"]["Row"]["status"];

export async function requestProductAvailability(
  _prevState: AvailabilityRequestState,
  formData: FormData,
): Promise<AvailabilityRequestState> {
  const productId = formData.get("product_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  if (!productId || !name || !email) return { error: "Name and email are required." };

  const phone = (formData.get("phone") as string)?.trim() || null;
  const quantity = Math.max(1, Number(formData.get("quantity")) || 1);
  const message = (formData.get("message") as string)?.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("product_availability_requests").insert({
    product_id: productId,
    customer_id: user?.id ?? null,
    name,
    email,
    phone,
    quantity,
    message,
  });

  if (error) return { error: "Could not send your request. Please try again." };

  const { data: product } = await supabase.from("products").select("name, sku").eq("id", productId).maybeSingle();
  if (product) {
    await sendProductRequestNotification({
      productName: product.name,
      productSku: product.sku,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      quantity,
      message,
    });
  }

  return { success: true };
}

// Admin-facing: staff-only per product_availability_requests' RLS policy.
export async function updateProductAvailabilityRequestStatus(requestId: string, formData: FormData) {
  const supabase = await createClient();
  const status = formData.get("status") as AvailabilityRequestStatus;

  await supabase.from("product_availability_requests").update({ status }).eq("id", requestId);
  revalidatePath("/admin/product-requests");
}
