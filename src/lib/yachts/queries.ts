import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Yacht = Database["public"]["Tables"]["yachts"]["Row"];

export async function getYachtsForUser() {
  const supabase = await createClient();
  const { data } = await supabase.from("yachts").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getYacht(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("yachts").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function getYachtWithRegister(id: string) {
  const supabase = await createClient();
  const [{ data: yacht }, { data: equipment }, { data: filters }] = await Promise.all([
    supabase.from("yachts").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("equipment")
      .select("*, equipment_type:equipment_types(name)")
      .eq("yacht_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("filters")
      .select("*, product:products(name, sku)")
      .eq("yacht_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!yacht) return null;
  return { yacht, equipment: equipment ?? [], filters: filters ?? [] };
}
