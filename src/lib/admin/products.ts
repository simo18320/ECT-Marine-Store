import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type Product = Database["public"]["Tables"]["products"]["Row"];

export interface ProductListRow extends Product {
  category: { name: string } | null;
  brand: { name: string } | null;
}

export async function listProductsAdmin(): Promise<ProductListRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(name), brand:brands(name)")
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as ProductListRow[];
}

type ProductPrivate = Database["public"]["Tables"]["product_private"]["Row"];
/** The product as the edit form sees it: public row plus the staff-only cost/margin fields. */
export type ProductForEdit = Product & Omit<ProductPrivate, "product_id" | "updated_at">;

export async function getProductForEdit(id: string) {
  const supabase = await createClient();
  const [{ data: product }, { data: images }, { data: documents }, { data: costs }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
    supabase.from("product_documents").select("*").eq("product_id", id),
    supabase.from("product_private").select("*").eq("product_id", id).maybeSingle(),
  ]);

  if (!product) return null;
  // Cost and margin fields live in a staff-only table; the edit form sees them merged back in.
  const privateFields = {
    purchase_cost: costs?.purchase_cost ?? null,
    shipping_cost: costs?.shipping_cost ?? null,
    packaging_cost: costs?.packaging_cost ?? null,
    minimum_margin_percent: costs?.minimum_margin_percent ?? null,
    minimum_margin_amount: costs?.minimum_margin_amount ?? null,
    shipping_cost_it: costs?.shipping_cost_it ?? null,
    shipping_cost_eu: costs?.shipping_cost_eu ?? null,
    shipping_cost_uk: costs?.shipping_cost_uk ?? null,
    shipping_cost_int: costs?.shipping_cost_int ?? null,
  };
  const merged: ProductForEdit = { ...product, ...privateFields };
  return { product: merged, images: images ?? [], documents: documents ?? [] };
}

export async function listCategoriesFlat() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, parent_id").order("sort_order");
  if (!data) return [];

  // Depth-first flatten so a <select> can show indented "Water > Filtration > CTO".
  const byParent = new Map<string | null, typeof data>();
  for (const c of data) {
    const key = c.parent_id;
    byParent.set(key, [...(byParent.get(key) ?? []), c]);
  }

  const result: { id: string; label: string }[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const cat of byParent.get(parentId) ?? []) {
      result.push({ id: cat.id, label: `${"— ".repeat(depth)}${cat.name}` });
      walk(cat.id, depth + 1);
    }
  }
  walk(null, 0);
  return result;
}

export async function listBrands() {
  const supabase = await createClient();
  const { data } = await supabase.from("brands").select("id, name").order("name");
  return data ?? [];
}
