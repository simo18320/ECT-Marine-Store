"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { createClient } from "@/lib/supabase/server";

export async function setRestockMode(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const restockMode = formData.get("restock_mode") === "true";
  const restockLabel = (formData.get("restock_label") as string)?.trim() || "Coming soon";

  await supabase.from("store_settings").update({ restock_mode: restockMode, restock_label: restockLabel }).eq("id", true);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
