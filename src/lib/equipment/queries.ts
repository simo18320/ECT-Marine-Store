import { createClient } from "@/lib/supabase/server";

export async function listEquipmentTypes() {
  const supabase = await createClient();
  const { data } = await supabase.from("equipment_types").select("id, name, category").order("name");
  return data ?? [];
}

export async function listEquipmentForYacht(yachtId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipment")
    .select("id, location, equipment_type:equipment_types(name)")
    .eq("yacht_id", yachtId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getEquipment(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipment")
    .select("*, equipment_type:equipment_types(name), yacht:yachts(name)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Resolves a scanned QR code (equipment) — see database.md §0007 on qr_code_token. */
export async function getEquipmentByToken(token: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipment")
    .select("*, equipment_type:equipment_types(name), yacht:yachts(id, name)")
    .eq("qr_code_token", token)
    .maybeSingle();
  return data;
}
