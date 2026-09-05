import { createClient } from "@/lib/supabase/server";
import { getAvailableStock } from "@/lib/inventory/rules";
import type { ScoringWeights } from "./rules";

export async function listSuppliers() {
  const supabase = await createClient();
  const { data } = await supabase.from("suppliers").select("*").order("name");
  return data ?? [];
}

export async function getSupplier(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("suppliers").select("*").eq("id", id).single();
  return data;
}

export async function listSupplierProducts(supplierId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("supplier_products")
    .select("*, product:products(sku, name)")
    .eq("supplier_id", supplierId)
    .order("last_verified_at", { ascending: false, nullsFirst: false });
  return data ?? [];
}

// procurement.md §7 flywheel: available_stock <= reorder_point flags a product for procurement
// (business-rules.md §2). This only flags — it never auto-creates a purchase order.
export async function listLowStockProducts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inventory")
    .select("*, product:products(id, sku, name, is_active)")
    .order("updated_at", { ascending: false });

  return (data ?? []).filter(
    (row) => row.product?.is_active && getAvailableStock(row) <= row.reorder_point,
  );
}

export async function listRfqs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rfqs")
    .select("*, product:products(sku, name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getRfqDetail(id: string) {
  const supabase = await createClient();
  const [{ data: rfq }, { data: rfqSuppliers }, { data: quotes }] = await Promise.all([
    supabase.from("rfqs").select("*, product:products(id, sku, name, purchase_cost)").eq("id", id).single(),
    supabase.from("rfq_suppliers").select("*, supplier:suppliers(*)").eq("rfq_id", id),
    supabase.from("supplier_quotes").select("*, supplier:suppliers(*)").eq("rfq_id", id).order("created_at"),
  ]);

  return { rfq, rfqSuppliers: rfqSuppliers ?? [], quotes: quotes ?? [] };
}

export async function listSuppliersForSelect() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, name, status")
    .neq("status", "blocked")
    .order("name");
  return data ?? [];
}

export async function getScoringWeights(): Promise<ScoringWeights> {
  const supabase = await createClient();
  const { data } = await supabase.from("supplier_scoring_weights").select("*").eq("id", true).single();

  // Falls back to business-rules.md §6's documented defaults if the singleton row is ever missing
  // (it never should be — seeded by migration 0014 — but a query layer shouldn't crash on it).
  return {
    price: data?.price_weight ?? 0.3,
    leadTime: data?.lead_time_weight ?? 0.2,
    quality: data?.quality_weight ?? 0.2,
    reliability: data?.reliability_weight ?? 0.15,
    moq: data?.moq_weight ?? 0.05,
    shipping: data?.shipping_weight ?? 0.05,
    paymentTerms: data?.payment_terms_weight ?? 0.05,
  };
}
