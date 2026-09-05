"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, requireAdmin } from "@/lib/admin/guard";
// Suppliers/RFQs/quotes are staff-managed (ect_operator+), same as inventory — RLS on those
// tables (migration 0010) is staff-only, not admin-only. Only the purchase-order approval gate
// below is admin-only, per business-rules.md §7's explicit `approved_by` requirement.
import { createClient } from "@/lib/supabase/server";
import { computeLandedCost, isEligibleForOrder, rankQuotes, type QuoteForScoring } from "./rules";
import { getScoringWeights } from "./queries";
import type { Database } from "@/types/database";

type SupplierStatus = Database["public"]["Enums"]["supplier_status"];

function readSupplierForm(formData: FormData) {
  const certifications = ((formData.get("certifications") as string) ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  return {
    name: formData.get("name") as string,
    country: (formData.get("country") as string) || null,
    website: (formData.get("website") as string) || null,
    status: formData.get("status") as SupplierStatus,
    payment_terms: (formData.get("payment_terms") as string) || null,
    certifications,
    contact_email: (formData.get("contact_email") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
    notes: (formData.get("notes") as string) || null,
    quality_score: formData.get("quality_score") ? Number(formData.get("quality_score")) : null,
    reliability_score: formData.get("reliability_score") ? Number(formData.get("reliability_score")) : null,
  };
}

export async function createSupplier(formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const { data, error } = await supabase.from("suppliers").insert(readSupplierForm(formData)).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create supplier.");
  revalidatePath("/admin/suppliers");
  redirect(`/admin/suppliers/${data.id}`);
}

export async function updateSupplier(id: string, formData: FormData) {
  await requireStaff();
  const supabase = await createClient();
  await supabase.from("suppliers").update(readSupplierForm(formData)).eq("id", id);
  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${id}`);
}

export async function createSupplierProduct(supplierId: string, formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  await supabase.from("supplier_products").insert({
    supplier_id: supplierId,
    product_id: (formData.get("product_id") as string) || null,
    external_sku: (formData.get("external_sku") as string) || null,
    description: (formData.get("description") as string) || null,
    unit_price: formData.get("unit_price") ? Number(formData.get("unit_price")) : null,
    currency: (formData.get("currency") as string) || "EUR",
    moq: formData.get("moq") ? Number(formData.get("moq")) : null,
    lead_time_days: formData.get("lead_time_days") ? Number(formData.get("lead_time_days")) : null,
    shipping_estimate: formData.get("shipping_estimate") ? Number(formData.get("shipping_estimate")) : null,
    last_verified_at: new Date().toISOString(),
  });

  revalidatePath(`/admin/suppliers/${supplierId}`);
}

export async function createRfq(formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();

  const supplierIds = formData.getAll("supplier_ids") as string[];
  if (supplierIds.length === 0) throw new Error("Select at least one supplier to RFQ.");

  const { data: rfq, error } = await supabase
    .from("rfqs")
    .insert({
      product_id: formData.get("product_id") as string,
      quantity: Number(formData.get("quantity")),
      specification: (formData.get("specification") as string) || null,
      destination: (formData.get("destination") as string) || null,
      requested_delivery_date: (formData.get("requested_delivery_date") as string) || null,
      created_by: staff.userId,
    })
    .select("id")
    .single();
  if (error || !rfq) throw new Error(error?.message ?? "Failed to create RFQ.");

  await supabase.from("rfq_suppliers").insert(supplierIds.map((supplierId) => ({ rfq_id: rfq.id, supplier_id: supplierId })));

  revalidatePath("/admin/procurement");
  redirect(`/admin/procurement/rfqs/${rfq.id}`);
}

export async function markRfqSupplierSent(rfqId: string, supplierId: string) {
  await requireStaff();
  const supabase = await createClient();

  await supabase
    .from("rfq_suppliers")
    .update({ sent_at: new Date().toISOString() })
    .eq("rfq_id", rfqId)
    .eq("supplier_id", supplierId);

  await supabase.from("rfqs").update({ status: "sent" }).eq("id", rfqId).eq("status", "draft");

  revalidatePath(`/admin/procurement/rfqs/${rfqId}`);
}

// Every quote's score depends on how it compares to the other quotes on the same RFQ
// (business-rules.md §6 normalizes price/lead-time/shipping relative to the candidate set), so
// adding a quote re-scores the whole set rather than just the new row.
async function recomputeRfqScores(rfqId: string, requestedQuantity: number) {
  const supabase = await createClient();
  const [{ data: quotes }, weights] = await Promise.all([
    supabase.from("supplier_quotes").select("*, supplier:suppliers(status, quality_score, reliability_score)").eq("rfq_id", rfqId),
    getScoringWeights(),
  ]);

  const forScoring: QuoteForScoring[] = (quotes ?? [])
    .filter((q) => q.supplier)
    .map((q) => ({
      id: q.id,
      unitPrice: q.unit_price,
      leadTimeDays: q.lead_time_days,
      moq: q.moq,
      shippingCost: q.shipping_cost,
      paymentTerms: q.payment_terms,
      supplierStatus: q.supplier!.status,
      supplierQualityScore: q.supplier!.quality_score,
      supplierReliabilityScore: q.supplier!.reliability_score,
    }));

  const ranked = rankQuotes(forScoring, weights, requestedQuantity);
  await Promise.all(ranked.map((q) => supabase.from("supplier_quotes").update({ score: q.score }).eq("id", q.id)));
}

export async function createSupplierQuote(rfqId: string, formData: FormData) {
  await requireStaff();
  const supabase = await createClient();

  const { data: rfq } = await supabase.from("rfqs").select("quantity, status").eq("id", rfqId).single();
  if (!rfq) throw new Error("RFQ not found.");

  const unitPrice = Number(formData.get("unit_price"));
  const shippingCost = formData.get("shipping_cost") ? Number(formData.get("shipping_cost")) : null;
  const dutiesCost = formData.get("duties_cost") ? Number(formData.get("duties_cost")) : null;
  const handlingCost = formData.get("handling_cost") ? Number(formData.get("handling_cost")) : null;

  const landedCost = computeLandedCost({ unitPrice, shippingCost, dutiesCost, handlingCost });

  await supabase.from("supplier_quotes").insert({
    rfq_id: rfqId,
    supplier_id: formData.get("supplier_id") as string,
    unit_price: unitPrice,
    currency: (formData.get("currency") as string) || "EUR",
    moq: formData.get("moq") ? Number(formData.get("moq")) : null,
    lead_time_days: formData.get("lead_time_days") ? Number(formData.get("lead_time_days")) : null,
    shipping_cost: shippingCost,
    duties_cost: dutiesCost,
    handling_cost: handlingCost,
    payment_terms: (formData.get("payment_terms") as string) || null,
    valid_until: (formData.get("valid_until") as string) || null,
    landed_cost: landedCost,
  });

  if (rfq.status === "draft" || rfq.status === "sent") {
    await supabase.from("rfqs").update({ status: "quoted" }).eq("id", rfqId);
  }

  await recomputeRfqScores(rfqId, rfq.quantity);

  revalidatePath(`/admin/procurement/rfqs/${rfqId}`);
}

// procurement.md §2 + §6: the approval gate. A DISCOVERED/UNDER_REVIEW supplier is a lead, not an
// approved source — this is the hard rule the doc calls out explicitly, enforced here rather than
// only in the UI, so a form field being hidden is never the only thing stopping this.
export async function createPurchaseOrder(rfqId: string, quoteId: string) {
  const staff = await requireAdmin();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("supplier_quotes")
    .select("*, supplier:suppliers(id, status)")
    .eq("id", quoteId)
    .single();
  if (!quote || !quote.supplier) throw new Error("Quote not found.");

  if (!isEligibleForOrder(quote.supplier.status)) {
    throw new Error(
      `${quote.supplier.status} suppliers cannot be awarded a purchase order — qualify them first (procurement.md §2).`,
    );
  }

  const { data: rfq } = await supabase.from("rfqs").select("product_id, quantity").eq("id", rfqId).single();
  if (!rfq) throw new Error("RFQ not found.");

  const totalCost = quote.unit_price * rfq.quantity;
  const landedCost = quote.landed_cost !== null ? quote.landed_cost * rfq.quantity : null;

  const { data: order, error } = await supabase
    .from("supplier_orders")
    .insert({
      supplier_id: quote.supplier.id,
      rfq_id: rfqId,
      status: "sent",
      currency: quote.currency,
      total_cost: totalCost,
      landed_cost: landedCost,
      created_by: staff.userId,
      approved_by: staff.userId,
      approved_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !order) throw new Error(error?.message ?? "Failed to create purchase order.");

  await supabase.from("supplier_order_items").insert({
    supplier_order_id: order.id,
    product_id: rfq.product_id,
    quantity: rfq.quantity,
    unit_cost: quote.unit_price,
    line_total: totalCost,
  });

  await supabase.from("rfqs").update({ status: "awarded" }).eq("id", rfqId);

  revalidatePath(`/admin/procurement/rfqs/${rfqId}`);
  revalidatePath("/admin/procurement");
}
