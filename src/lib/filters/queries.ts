import { createClient } from "@/lib/supabase/server";

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

/** Products suitable for filter tracking — anything in the Water/Filtration tree keeps the
 * select from becoming a dump of the whole catalogue (e.g. sampling kits aren't "filters"). */
export async function listFilterableProducts() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("id, sku, name").eq("is_active", true).order("name");
  return data ?? [];
}
