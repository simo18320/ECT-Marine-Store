import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];

export interface FilterProductForPurchase
  extends Pick<
    Product,
    "id" | "sku" | "name" | "slug" | "selling_price" | "vat_rate" | "requires_compliance_ack" | "delivery_estimate"
  > {
  availability_status: string | null;
}

export async function getFilter(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("filters")
    .select("*, product:products(name, sku), yacht:yachts(name)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Resolves a scanned QR code (filter) — see database.md §0007 on qr_code_token. */
export async function getFilterByToken(token: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("filters")
    .select("*, product:products(name, sku), yacht:yachts(id, name)")
    .eq("qr_code_token", token)
    .maybeSingle();
  return data;
}

/** Purchase-relevant fields for the product a scanned filter links to — a separate top-level
 * query rather than embedding these into getFilterByToken's select, because availability_status
 * is a PostgREST computed field and those only resolve on the table being queried directly, not
 * on a nested embed (and raw inventory numbers aren't RLS-readable by a customer at all, which is
 * exactly why that computed field exists — so this can't just join inventory instead). */
export async function getFilterProductForPurchase(productId: string): Promise<FilterProductForPurchase | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, sku, name, slug, selling_price, vat_rate, requires_compliance_ack, delivery_estimate, availability_status")
    .eq("id", productId)
    .maybeSingle();
  return data as unknown as FilterProductForPurchase | null;
}

/** Products suitable for filter tracking — anything in the Water/Filtration tree keeps the
 * select from becoming a dump of the whole catalogue (e.g. sampling kits aren't "filters"). */
export async function listFilterableProducts() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id, sku, name").eq("is_active", true).order("name");
  return data ?? [];
}
