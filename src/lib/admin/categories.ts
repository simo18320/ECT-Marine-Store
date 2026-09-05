import { createClient } from "@/lib/supabase/server";

export async function getCategory(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  return data;
}
