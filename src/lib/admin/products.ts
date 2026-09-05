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

export async function getProductForEdit(id: string) {
  const supabase = await createClient();
  const [{ data: product }, { data: images }, { data: documents }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
    supabase.from("product_documents").select("*").eq("product_id", id),
  ]);

  if (!product) return null;
  return { product, images: images ?? [], documents: documents ?? [] };
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
