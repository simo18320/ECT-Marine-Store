"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "./guard";
import { createClient } from "@/lib/supabase/server";
import { generateUniqueSlug, slugify } from "@/lib/slug";

function readCategoryForm(formData: FormData) {
  const parentId = formData.get("parent_id") as string;
  return {
    name: formData.get("name") as string,
    slug: (formData.get("slug") as string | null)?.trim() || "",
    parent_id: parentId || null,
    description: (formData.get("description") as string) || null,
    sort_order: Number(formData.get("sort_order")) || 0,
  };
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const fields = readCategoryForm(formData);
  const slug = fields.slug || (await generateUniqueSlug(supabase, "categories", fields.name, "category"));

  await supabase.from("categories").insert({ ...fields, slug });
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const fields = readCategoryForm(formData);
  // A hand-typed slug still gets normalized rather than trusted as-is — this is exactly how one
  // category ended up with its display name ("Water Purifiers, Refrigerators, Carbonators")
  // saved verbatim as the slug, which 404s because nothing else in the app URL-encodes it that way.
  const slug = slugify(fields.slug) || (await generateUniqueSlug(supabase, "categories", fields.name, "category"));

  await supabase.from("categories").update({ ...fields, slug }).eq("id", id);
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
