"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readFilterForm(formData: FormData) {
  return {
    equipment_id: (formData.get("equipment_id") as string) || null,
    location: (formData.get("location") as string) || null,
    filter_type: (formData.get("filter_type") as string) || null,
    product_id: formData.get("product_id") as string,
    installation_date: (formData.get("installation_date") as string) || null,
    replacement_interval_days: formData.get("replacement_interval_days")
      ? Number(formData.get("replacement_interval_days"))
      : null,
  };
}

export async function createFilter(yachtId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("filters").insert({ ...readFilterForm(formData), yacht_id: yachtId });

  revalidatePath(`/my-yacht/${yachtId}`);
  redirect(`/my-yacht/${yachtId}`);
}

export async function updateFilter(yachtId: string, filterId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("filters").update(readFilterForm(formData)).eq("id", filterId);

  revalidatePath(`/my-yacht/${yachtId}`);
  redirect(`/my-yacht/${yachtId}`);
}

export async function deleteFilter(yachtId: string, formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  await supabase.from("filters").delete().eq("id", id);

  revalidatePath(`/my-yacht/${yachtId}`);
}
