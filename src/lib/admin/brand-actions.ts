"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./guard";
import { createClient } from "@/lib/supabase/server";

export type BrandFormState = { error?: string };

function readBrandForm(formData: FormData) {
  return {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    website: (formData.get("website") as string) || null,
  };
}

function friendlyBrandError(error: { code?: string; message: string } | null): string {
  if (!error) return "Could not save brand.";
  if (error.code === "23505" && error.message.includes("brands_slug_key")) {
    return "That slug is already used by another brand — choose a different one.";
  }
  return error.message;
}

export async function createBrand(_prevState: BrandFormState, formData: FormData): Promise<BrandFormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("brands").insert(readBrandForm(formData));
  if (error) return { error: friendlyBrandError(error) };

  revalidatePath("/admin/brands");
  redirect("/admin/brands");
}

export async function updateBrand(
  id: string,
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("brands").update(readBrandForm(formData)).eq("id", id);
  if (error) return { error: friendlyBrandError(error) };

  revalidatePath("/admin/brands");
  redirect("/admin/brands");
}

// products.brand_id is ON DELETE SET NULL, so this never fails on referenced products — it
// just clears their brand back to "— None —" rather than blocking the delete.
export async function deleteBrand(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = formData.get("id") as string;

  await supabase.from("brands").delete().eq("id", id);
  revalidatePath("/admin/brands");
}
