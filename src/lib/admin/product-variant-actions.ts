"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "./guard";
import { createClient } from "@/lib/supabase/server";
import { generateUniqueSlug } from "@/lib/slug";
import type { Json } from "@/types/database";

export type VariantFormState = { error?: string; created?: { id: string; sku: string; name: string }[] };

async function generateNextSku(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data } = await supabase.from("products").select("sku").like("sku", "ECT-%");
  const nextNumber =
    (data ?? [])
      .map((row) => /^ECT-(\d{4,})$/.exec(row.sku)?.[1])
      .filter((n): n is string => Boolean(n))
      .map(Number)
      .reduce((max, n) => Math.max(max, n), 0) + 1;
  return `ECT-${String(nextNumber).padStart(4, "0")}`;
}

// One submission from VariantProductForm creates several sibling products at once — the same
// filter type sold in a few fixed sizes/classes (e.g. a Zehnder replacement filter in G4 and F7,
// or a filter media roll in 1x20m and 2x20m), which is otherwise a lot of repetitive single-product
// form-filling since this catalog has no native product-variant concept (each size is its own SKU).
export async function createProductVariants(
  _prevState: VariantFormState,
  formData: FormData,
): Promise<VariantFormState> {
  await requireAdmin();
  const supabase = await createClient();

  const baseName = (formData.get("base_name") as string)?.trim();
  const categoryId = formData.get("category_id") as string;
  if (!baseName) return { error: "Base name is required." };
  if (!categoryId) return { error: "Category is required." };

  const brandId = (formData.get("brand_id") as string) || null;
  const description = (formData.get("description") as string) || null;
  const shortDescription = (formData.get("short_description") as string) || null;
  const unit = (formData.get("unit") as string) || "pcs";
  const vatRate = Number(formData.get("vat_rate")) || 22;

  const count = Number(formData.get("variant_count")) || 0;
  if (count < 1) return { error: "Add at least one size/variant row." };

  const rows: {
    size: string;
    filterClass: string;
    weightKg: number | null;
    sku: string;
    purchaseCost: number | null;
    sellingPrice: number;
  }[] = [];

  for (let i = 0; i < count; i++) {
    const size = ((formData.get(`variant_size_${i}`) as string) || "").trim();
    const filterClass = ((formData.get(`variant_class_${i}`) as string) || "").trim();
    const weightRaw = formData.get(`variant_weight_${i}`) as string;
    const skuRaw = ((formData.get(`variant_sku_${i}`) as string) || "").trim();
    const purchaseCostRaw = formData.get(`variant_purchase_cost_${i}`) as string;
    const sellingPriceRaw = formData.get(`variant_selling_price_${i}`) as string;

    const sellingPrice = Number(sellingPriceRaw);
    if (!sellingPriceRaw || Number.isNaN(sellingPrice)) {
      return { error: `Row ${i + 1}: selling price is required.` };
    }

    rows.push({
      size,
      filterClass,
      weightKg: weightRaw ? Number(weightRaw) : null,
      sku: skuRaw,
      purchaseCost: purchaseCostRaw ? Number(purchaseCostRaw) : null,
      sellingPrice,
    });
  }

  const created: { id: string; sku: string; name: string }[] = [];

  for (const row of rows) {
    const suffix = [row.size, row.filterClass].filter(Boolean).join(" ") || null;
    const name = suffix ? `${baseName} — ${suffix}` : baseName;

    const technicalSpecs: Json = {};
    if (row.size) (technicalSpecs as Record<string, Json>).size = row.size;
    if (row.filterClass) (technicalSpecs as Record<string, Json>).filter_class = row.filterClass;

    const sku = row.sku || (await generateNextSku(supabase));
    const slug = await generateUniqueSlug(supabase, "products", name, "product");

    const { data: inserted, error } = await supabase.from("products").insert({
      sku,
      name,
      slug,
      category_id: categoryId,
      brand_id: brandId,
      description,
      short_description: shortDescription,
      technical_specs: technicalSpecs,
      unit,
      purchase_cost: row.purchaseCost,
      selling_price: row.sellingPrice,
      vat_rate: vatRate,
      weight_kg: row.weightKg,
      shipping_cost: null,
      delivery_estimate: null,
      replacement_interval_days: null,
      certifications: [],
      requires_compliance_ack: false,
      is_active: true,
    }).select("id").single();

    if (error || !inserted) {
      return {
        error: `Created ${created.length} of ${rows.length} before failing on "${name}": ${error?.message ?? "unknown error"}`,
        created,
      };
    }

    created.push({ id: inserted.id, sku, name });
  }

  revalidatePath("/admin/products");
  return { created };
}
