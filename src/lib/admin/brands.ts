import { createClient } from "@/lib/supabase/server";

export async function getBrand(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function listBrandsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("*").order("name");
  return data ?? [];
}
