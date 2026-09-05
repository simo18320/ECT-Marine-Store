import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Address = Database["public"]["Tables"]["customer_addresses"]["Row"];

export async function getAddresses(): Promise<Address[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getAddressById(id: string): Promise<Address | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("customer_addresses").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
