"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export async function setShippingSettings(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const threshold = Number(formData.get("free_shipping_threshold"));
  const fee = Number(formData.get("shipping_fee_italy"));
  if (!Number.isFinite(threshold) || threshold < 0 || !Number.isFinite(fee) || fee < 0) return;

  await supabase
    .from("store_settings")
    .update({ free_shipping_threshold: threshold, shipping_fee_italy: fee })
    .eq("id", true);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

export async function setRestockMode(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const restockMode = formData.get("restock_mode") === "true";
  const restockLabel = (formData.get("restock_label") as string)?.trim() || "Coming soon";

  await supabase.from("store_settings").update({ restock_mode: restockMode, restock_label: restockLabel }).eq("id", true);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
