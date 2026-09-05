import { createClient } from "@/lib/supabase/server";
import { getYachtWithRegister } from "@/lib/yachts/queries";
import { searchProducts, type ProductListItem } from "@/lib/products/queries";
import { getRecommendationsForProblem, type RecommendationResult } from "@/lib/recommendations/engine";
import {
  computeEquipmentReplacementStatus,
  computeFilterReplacementStatus,
  type ReplacementInfo,
} from "@/lib/maintenance/rules";

/**
 * ai-engine.md §2: every retrieval function returns data tagged with where it came from and when
 * it was fetched, so the prompt assembled for Claude carries that provenance instead of presenting
 * everything as equally current — and so the assistant has something concrete to cite as "known".
 */
export interface Retrieved<T> {
  data: T;
  source: "supabase";
  asOf: string;
}

function wrap<T>(data: T): Retrieved<T> {
  return { data, source: "supabase", asOf: new Date().toISOString() };
}

export interface CustomerContext {
  fullName: string | null;
  accountType: string;
  companyName: string | null;
  recentOrders: { orderNumber: string; status: string; grandTotal: number; createdAt: string }[];
  yachts: { id: string; name: string }[];
}

export async function getCustomerContext(profileId: string): Promise<Retrieved<CustomerContext>> {
  const supabase = await createClient();
  const [{ data: profile }, { data: orders }, { data: yachts }] = await Promise.all([
    supabase.from("profiles").select("full_name, account_type, company:companies(name)").eq("id", profileId).maybeSingle(),
    supabase
      .from("orders")
      .select("order_number, status, grand_total, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("yachts").select("id, name").order("created_at", { ascending: false }),
  ]);

  return wrap({
    fullName: profile?.full_name ?? null,
    accountType: profile?.account_type ?? "individual",
    companyName: profile?.company?.name ?? null,
    recentOrders: (orders ?? []).map((o) => ({
      orderNumber: o.order_number,
      status: o.status,
      grandTotal: o.grand_total,
      createdAt: o.created_at,
    })),
    yachts: yachts ?? [],
  });
}

export interface YachtContextEquipment {
  equipmentType: string | null;
  manufacturer: string | null;
  model: string | null;
  location: string | null;
  replacement: ReplacementInfo;
}

export interface YachtContextFilter {
  productName: string | null;
  productSku: string | null;
  replacement: ReplacementInfo;
}

export interface YachtContext {
  name: string;
  equipment: YachtContextEquipment[];
  filters: YachtContextFilter[];
}

export async function getYachtContext(yachtId: string): Promise<Retrieved<YachtContext | null>> {
  const register = await getYachtWithRegister(yachtId);
  if (!register) return wrap(null);

  return wrap({
    name: register.yacht.name,
    equipment: register.equipment.map((e) => ({
      equipmentType: e.equipment_type?.name ?? null,
      manufacturer: e.manufacturer,
      model: e.model,
      location: e.location,
      replacement: computeEquipmentReplacementStatus(e),
    })),
    filters: register.filters.map((f) => ({
      productName: f.product?.name ?? null,
      productSku: f.product?.sku ?? null,
      replacement: computeFilterReplacementStatus(f.installation_date, f.replacement_interval_days),
    })),
  });
}

// ai-engine.md §2 originally described this as reading a `replacement_schedules` table; there is
// no writer for that table (business-rules.md §3's Phase 5 correction — staff/cron-only, nothing
// populates it in MVP), so this is the same live computation getYachtContext already does, kept
// as its own function only because the doc's data-access contract names it separately.
export async function getReplacementStatus(yachtId: string): Promise<Retrieved<YachtContext | null>> {
  return getYachtContext(yachtId);
}

export async function getProductContext(query: string): Promise<Retrieved<ProductListItem[]>> {
  const results = await searchProducts(query);
  return wrap(results.slice(0, 8));
}

export async function getRecommendations(problemId: string, yachtId?: string): Promise<Retrieved<RecommendationResult[]>> {
  const results = await getRecommendationsForProblem(problemId, yachtId);
  return wrap(results);
}
