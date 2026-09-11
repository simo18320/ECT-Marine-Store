import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const SLUG_MAX_LENGTH = 60;

export function slugify(text: string): string {
  const full = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (full.length <= SLUG_MAX_LENGTH) return full;
  // Cut at the last word boundary within the limit rather than mid-word — supplier product
  // names run long, and "...sediment-filter-cartridge-fit" reads as broken, not just truncated.
  return full.slice(0, SLUG_MAX_LENGTH).replace(/-[^-]*$/, "");
}

type SlugTable = "products" | "categories";

// Shared by both product and category creation: left blank (or, for categories, typed by hand
// as something that isn't already a slug), the slug is derived from the name and de-duplicated
// against whatever else already starts with the same base — still just a normal editable field
// afterward if the admin wants to shorten or tweak it.
export async function generateUniqueSlug(
  supabase: SupabaseClient<Database>,
  table: SlugTable,
  name: string,
  fallback: string,
): Promise<string> {
  const base = slugify(name) || fallback;
  const { data } = await supabase.from(table).select("slug").like("slug", `${base}%`);
  const existing = new Set((data ?? []).map((row) => row.slug));

  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}
