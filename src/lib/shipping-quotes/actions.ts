"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";
import { escapeHtml, sendEmail } from "@/lib/email/send";
import { COMPANY } from "@/lib/company";

export type ShippingQuoteState = { error?: string; success?: boolean };

export async function requestShippingQuote(
  items: { productId: string; quantity: number }[],
  addressId: string,
  message: string,
): Promise<ShippingQuoteState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to request a quote." };
  if (items.length === 0) return { error: "Your cart is empty." };

  const { data: address } = await supabase
    .from("customer_addresses")
    .select("full_name, line1, line2, city, postal_code, country")
    .eq("id", addressId)
    .maybeSingle();
  if (!address) return { error: "Select a delivery address." };

  const { data: products } = await supabase
    .from("products")
    .select("id, sku, name")
    .in("id", items.map((i) => i.productId));
  const summary = items.map((i) => {
    const p = products?.find((x) => x.id === i.productId);
    return { sku: p?.sku ?? "?", name: p?.name ?? "?", quantity: i.quantity };
  });
  const addressSummary = [address.full_name, address.line1, address.line2, `${address.postal_code} ${address.city}`, address.country]
    .filter(Boolean)
    .join(", ");

  const email = user.email ?? "";
  const { error } = await supabase.from("shipping_quote_requests").insert({
    customer_id: user.id,
    email,
    country: address.country,
    address_summary: addressSummary,
    items: summary,
    message: message.trim() || null,
  });
  if (error) return { error: "Could not send your request. Please try again." };

  const list = summary.map((i) => `<li>${i.quantity}× ${escapeHtml(i.name)} (${escapeHtml(i.sku)})</li>`).join("");
  const staff = process.env.STAFF_NOTIFICATION_EMAIL;
  await Promise.all([
    staff
      ? sendEmail(
          staff,
          `Shipping quote request — ${address.country}`,
          `<h1 style="font-size:20px;">Shipping quote request</h1><p>${escapeHtml(email)} — ${escapeHtml(addressSummary)}</p><ul>${list}</ul>${message.trim() ? `<p>${escapeHtml(message.trim())}</p>` : ""}<p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/product-requests">View in admin</a></p>`,
        )
      : Promise.resolve(),
    email
      ? sendEmail(
          email,
          "We received your shipping quote request",
          `<h1 style="font-size:20px;">Quote request received</h1><p>Shipping outside Italy is quoted individually. We will send you the shipping cost and payment details for your order to ${escapeHtml(address.country)} shortly.</p><ul>${list}</ul><p style="color:#666;font-size:13px;">${escapeHtml(COMPANY.legalName)}</p>`,
        )
      : Promise.resolve(),
  ]);

  return { success: true };
}

export async function updateShippingQuoteStatus(id: string, formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("shipping_quote_requests").update({ status: formData.get("status") as string }).eq("id", id);
  revalidatePath("/admin/product-requests");
}
