"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./guard";
import { createClient } from "@/lib/supabase/server";

function readCategoryForm(formData: FormData) {
  const parentId = formData.get("parent_id") as string;
  return {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    parent_id: parentId || null,
    description: (formData.get("description") as string) || null,
    sort_order: Number(formData.get("sort_order")) || 0,
  };
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("categories").insert(readCategoryForm(formData));
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("categories").update(readCategoryForm(formData)).eq("id", id);
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = formData.get("id") as string;
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
}
