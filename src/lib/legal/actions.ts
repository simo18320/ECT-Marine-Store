"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import {
  notifyStaffOfPrivacyRequest,
  notifyStaffOfWithdrawal,
  sendPrivacyAcknowledgement,
  sendWithdrawalAcknowledgement,
} from "@/lib/email/legal-notifications";

export type LegalRequestState = { error?: string; success?: boolean };

// Withdrawal makes sense once the order was paid and hasn't been cancelled/refunded already.
const WITHDRAWABLE_STATUSES = ["paid", "processing", "shipped", "delivered"];
const PRIVACY_TYPES = ["access", "erasure", "rectification", "restriction", "portability", "objection", "other"];

export async function requestWithdrawal(
  orderNumber: string,
  _prev: LegalRequestState,
  formData: FormData,
): Promise<LegalRequestState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to withdraw from an order." };

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order) return { error: "Order not found." };
  if (!WITHDRAWABLE_STATUSES.includes(order.status)) {
    return { error: "This order can't be withdrawn from online. Please contact us." };
  }

  const { data: existing } = await supabase.from("withdrawal_requests").select("id").eq("order_id", order.id).maybeSingle();
  if (existing) return { error: "A withdrawal request for this order was already submitted." };

  const message = (formData.get("message") as string)?.trim() || null;
  const { error } = await supabase
    .from("withdrawal_requests")
    .insert({ order_id: order.id, customer_id: user.id, message });
  if (error) return { error: "Could not submit your request. Please try again." };

  const email = user.email ?? "";
  await Promise.all([
    email ? sendWithdrawalAcknowledgement({ toEmail: email, orderNumber }) : Promise.resolve(),
    notifyStaffOfWithdrawal({ orderNumber, customerEmail: email, message }),
  ]);

  revalidatePath(`/account/orders/${orderNumber}`);
  return { success: true };
}

export async function submitPrivacyRequest(_prev: LegalRequestState, formData: FormData): Promise<LegalRequestState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to submit a privacy request." };

  const requestType = formData.get("request_type") as string;
  if (!PRIVACY_TYPES.includes(requestType)) return { error: "Choose the type of request." };
  const message = (formData.get("message") as string)?.trim() || null;
  const email = user.email ?? "";

  const { error } = await supabase
    .from("privacy_requests")
    .insert({ customer_id: user.id, email, request_type: requestType, message });
  if (error) return { error: "Could not submit your request. Please try again." };

  await Promise.all([
    email ? sendPrivacyAcknowledgement({ toEmail: email, requestType }) : Promise.resolve(),
    notifyStaffOfPrivacyRequest({ customerEmail: email, requestType, message }),
  ]);
  return { success: true };
}

export async function updateLegalRequestStatus(kind: "withdrawal" | "privacy", id: string, formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const status = formData.get("status") as string;
  if (kind === "withdrawal") {
    await supabase.from("withdrawal_requests").update({ status }).eq("id", id);
  } else {
    await supabase.from("privacy_requests").update({ status }).eq("id", id);
  }
  revalidatePath("/admin/legal-requests");
}
