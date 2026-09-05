"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function readYachtForm(formData: FormData) {
  const numberOrNull = (key: string) => {
    const value = formData.get(key) as string;
    return value ? Number(value) : null;
  };

  return {
    name: formData.get("name") as string,
    yacht_type: (formData.get("yacht_type") as string) || null,
    length_m: numberOrNull("length_m"),
    build_year: numberOrNull("build_year"),
    flag: (formData.get("flag") as string) || null,
    cruising_area: (formData.get("cruising_area") as string) || null,
    crew_count: numberOrNull("crew_count"),
    guest_count: numberOrNull("guest_count"),
    water_tank_capacity_l: numberOrNull("water_tank_capacity_l"),
    freshwater_production_lpd: numberOrNull("freshwater_production_lpd"),
    desalination_system: (formData.get("desalination_system") as string) || null,
    filtration_notes: (formData.get("filtration_notes") as string) || null,
    uv_notes: (formData.get("uv_notes") as string) || null,
    hvac_notes: (formData.get("hvac_notes") as string) || null,
    air_monitoring_notes: (formData.get("air_monitoring_notes") as string) || null,
  };
}

export async function createYacht(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-yacht");

  const { data, error } = await supabase
    .from("yachts")
    .insert({ ...readYachtForm(formData), owner_id: user.id })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create yacht.");

  // The owner is automatically a yacht_users member too, so equipment/filter RLS
  // (is_yacht_member) covers them without special-casing owner_id everywhere.
  await supabase.from("yacht_users").insert({ yacht_id: data.id, profile_id: user.id, role: "owner" });

  revalidatePath("/my-yacht");
  redirect(`/my-yacht/${data.id}`);
}

export async function updateYacht(id: string, formData: FormData) {
  const supabase = await createClient();
  await supabase.from("yachts").update(readYachtForm(formData)).eq("id", id);

  revalidatePath("/my-yacht");
  revalidatePath(`/my-yacht/${id}`);
  redirect(`/my-yacht/${id}`);
}

export async function deleteYacht(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  await supabase.from("yachts").delete().eq("id", id);

  revalidatePath("/my-yacht");
  redirect("/my-yacht");
}
