"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readEquipmentForm(formData: FormData) {
  return {
    equipment_type_id: (formData.get("equipment_type_id") as string) || null,
    manufacturer: (formData.get("manufacturer") as string) || null,
    model: (formData.get("model") as string) || null,
    serial_number: (formData.get("serial_number") as string) || null,
    location: (formData.get("location") as string) || null,
    installation_date: (formData.get("installation_date") as string) || null,
    status: (formData.get("status") as string) || "active",
    maintenance_interval_days: formData.get("maintenance_interval_days")
      ? Number(formData.get("maintenance_interval_days"))
      : null,
    last_maintenance_date: (formData.get("last_maintenance_date") as string) || null,
    next_maintenance_date: (formData.get("next_maintenance_date") as string) || null,
  };
}

export async function createEquipment(yachtId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("equipment").insert({ ...readEquipmentForm(formData), yacht_id: yachtId });

  revalidatePath(`/my-yacht/${yachtId}`);
  redirect(`/my-yacht/${yachtId}`);
}

export async function updateEquipment(yachtId: string, equipmentId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("equipment").update(readEquipmentForm(formData)).eq("id", equipmentId);

  revalidatePath(`/my-yacht/${yachtId}`);
  redirect(`/my-yacht/${yachtId}`);
}

export async function deleteEquipment(yachtId: string, formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  await supabase.from("equipment").delete().eq("id", id);

  revalidatePath(`/my-yacht/${yachtId}`);
}
