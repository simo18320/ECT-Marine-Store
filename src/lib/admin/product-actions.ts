"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./guard";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

function readProductForm(formData: FormData) {
  const certifications = (formData.get("certifications") as string)
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  let technicalSpecs: Json = {};
  const rawSpecs = (formData.get("technical_specs") as string)?.trim();
  if (rawSpecs) {
    try {
      technicalSpecs = JSON.parse(rawSpecs);
    } catch {
      // Invalid JSON — fall back to empty rather than reject the whole form; the admin can
      // fix the specs in a follow-up edit without losing everything else they entered.
      technicalSpecs = {};
    }
  }

  const categoryId = formData.get("category_id") as string;
  const brandId = formData.get("brand_id") as string;

  return {
    sku: formData.get("sku") as string,
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    category_id: categoryId || null,
    brand_id: brandId || null,
    description: (formData.get("description") as string) || null,
    short_description: (formData.get("short_description") as string) || null,
    technical_specs: technicalSpecs,
    unit: (formData.get("unit") as string) || "pcs",
    purchase_cost: formData.get("purchase_cost") ? Number(formData.get("purchase_cost")) : null,
    selling_price: Number(formData.get("selling_price")),
    vat_rate: Number(formData.get("vat_rate")) || 22,
    weight_kg: formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null,
    replacement_interval_days: formData.get("replacement_interval_days")
      ? Number(formData.get("replacement_interval_days"))
      : null,
    certifications,
    requires_compliance_ack: formData.get("requires_compliance_ack") === "on",
    is_active: formData.get("is_active") === "on",
  };
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const fields = readProductForm(formData);

  const { data, error } = await supabase.from("products").insert(fields).select("id").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Could not create product.");
  }

  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}/edit`);
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const fields = readProductForm(formData);

  await supabase.from("products").update(fields).eq("id", id);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  redirect("/admin/products");
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const isActive = formData.get("is_active") === "true";

  await supabase.from("products").update({ is_active: !isActive }).eq("id", id);
  revalidatePath("/admin/products");
}

export async function addProductImage(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const url = formData.get("url") as string;
  const altText = (formData.get("alt_text") as string) || null;

  await supabase.from("product_images").insert({ product_id: productId, url, alt_text: altText });
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function deleteProductImage(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const imageId = formData.get("id") as string;

  await supabase.from("product_images").delete().eq("id", imageId);
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function addProductDocument(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const url = formData.get("url") as string;
  const docType = (formData.get("doc_type") as string) || "datasheet";

  await supabase.from("product_documents").insert({ product_id: productId, title, url, doc_type: docType });
  revalidatePath(`/admin/products/${productId}/edit`);
}

export async function deleteProductDocument(productId: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const docId = formData.get("id") as string;

  await supabase.from("product_documents").delete().eq("id", docId);
  revalidatePath(`/admin/products/${productId}/edit`);
}
