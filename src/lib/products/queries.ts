import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { parseAvailabilityStatus, type StockStatus } from "@/lib/inventory/rules";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface ProductListItem extends Product {
  availability_status: StockStatus;
  primary_image: Pick<ProductImage, "url" | "alt_text"> | null;
}

export interface ProductDetail extends Product {
  category: Category | null;
  availability_status: StockStatus;
  images: ProductImage[];
  documents: Database["public"]["Tables"]["product_documents"]["Row"][];
  compatibility: (Database["public"]["Tables"]["product_compatibility"]["Row"] & {
    equipment_type: Database["public"]["Tables"]["equipment_types"]["Row"] | null;
  })[];
  recommendations: (Database["public"]["Tables"]["product_recommendations"]["Row"] & {
    recommended_product: ProductListItem | null;
  })[];
  bundle_items: (Database["public"]["Tables"]["product_bundle_items"]["Row"] & {
    component_product: ProductListItem | null;
  })[];
}

// `inventory` itself is staff-only under RLS (raw stock counts are operationally sensitive —
// see database.md §3 / security.md). `availability_status` is a PostgREST "computed field"
// (a SECURITY DEFINER function taking the products row as its sole argument, migration 0013)
// exposing only a coarse status, never the raw numbers.
export const PRODUCT_LIST_SELECT = `
  *,
  availability_status,
  primary_image:product_images ( url, alt_text )
`;

export interface RawProductListRow extends Product {
  availability_status: string | null;
  // PostgREST embeds a to-many relation (a product can have several images) as an array, even
  // though only the first one is ever used here — that mismatch with the single-object type this
  // used to declare meant a product's real photo never rendered on any listing (only on its own
  // detail page, which queries product_images separately and indexes it correctly).
  primary_image: Pick<ProductImage, "url" | "alt_text">[] | null;
}

export function toListItem(row: RawProductListRow): ProductListItem {
  const { availability_status, primary_image, ...rest } = row;
  return {
    ...rest,
    availability_status: parseAvailabilityStatus(availability_status),
    primary_image: primary_image?.[0] ?? null,
  };
}

/** Full category tree, ordered by sort_order at every level. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  const byId = new Map<string, CategoryNode>(data.map((c) => [c.id, { ...c, children: [] }]));
  const roots: CategoryNode[] = [];

  for (const category of byId.values()) {
    if (category.parent_id && byId.has(category.parent_id)) {
      byId.get(category.parent_id)!.children.push(category);
    } else {
      roots.push(category);
    }
  }

  return roots;
}

/** A category plus its direct children and the ancestor chain (root → self) for breadcrumbs. */
export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) return null;

  const { data: children } = await supabase
    .from("categories")
    .select("*")
    .eq("parent_id", category.id)
    .order("sort_order", { ascending: true });

  const breadcrumb: Category[] = [category];
  let currentParentId = category.parent_id;
  while (currentParentId) {
    const { data: parent } = await supabase
      .from("categories")
      .select("*")
      .eq("id", currentParentId)
      .maybeSingle();
    if (!parent) break;
    breadcrumb.unshift(parent);
    currentParentId = parent.parent_id;
  }

  return { category, children: children ?? [], breadcrumb };
}

export interface ProductFilters {
  inStockOnly?: boolean;
  size?: string;
  micron?: string;
  use?: string;
  filterType?: string;
}

export interface ProductSpecFacets {
  sizes: string[];
  microns: string[];
  uses: string[];
  filterTypes: string[];
}

/** Distinct values actually present in this result set, for populating the storefront filter
 * dropdowns — computed from the same list the page already fetched, before the four facet
 * filters are applied, so a dropdown never offers an option that would zero out the results. */
export function getSpecFacets(items: ProductListItem[]): ProductSpecFacets {
  const sizes = new Set<string>();
  const microns = new Set<string>();
  const uses = new Set<string>();
  const filterTypes = new Set<string>();

  for (const item of items) {
    const specs = (item.technical_specs as Record<string, unknown>) ?? {};
    if (typeof specs.size === "string") sizes.add(specs.size);
    if (specs.micron_rating != null) microns.add(String(specs.micron_rating));
    if (typeof specs.use === "string") uses.add(specs.use);
    if (typeof specs.filter_type === "string") filterTypes.add(specs.filter_type);
  }

  return {
    sizes: [...sizes].sort(),
    microns: [...microns].sort((a, b) => Number(a) - Number(b)),
    uses: [...uses].sort(),
    filterTypes: [...filterTypes].sort(),
  };
}

// Same in-memory filtering approach as inStockOnly below — the catalogue is small enough that
// fetching a category/search result set and filtering in JS is simpler and safer than building
// dynamic JSONB-path query strings for four optional, independent facets.
function applySpecFilters(items: ProductListItem[], filters: ProductFilters): ProductListItem[] {
  return items.filter((p) => {
    const specs = (p.technical_specs as Record<string, unknown>) ?? {};
    if (filters.size && specs.size !== filters.size) return false;
    if (filters.micron && String(specs.micron_rating) !== filters.micron) return false;
    if (filters.use && specs.use !== filters.use) return false;
    if (filters.filterType && specs.filter_type !== filters.filterType) return false;
    return true;
  });
}

export async function getProductsByCategoryId(
  categoryId: string,
  filters: ProductFilters = {},
): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) return [];

  let items = (data as unknown as RawProductListRow[]).map(toListItem);
  if (filters.inStockOnly) items = items.filter((p) => p.availability_status !== "out_of_stock");
  return applySpecFilters(items, filters);
}

export async function searchProducts(
  queryText: string,
  filters: ProductFilters = {},
): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .eq("is_active", true)
    .textSearch("search_vector", queryText, { type: "websearch", config: "simple" })
    .order("name", { ascending: true });

  if (error || !data) return [];

  let items = (data as unknown as RawProductListRow[]).map(toListItem);
  if (filters.inStockOnly) items = items.filter((p) => p.availability_status !== "out_of_stock");
  return applySpecFilters(items, filters);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const supabase = await createClient();

  const { data: product } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
  if (!product) return null;

  const [
    { data: category },
    { data: availabilityRow },
    { data: images },
    { data: documents },
    { data: compatibility },
    { data: recommendations },
    { data: bundleItems },
  ] = await Promise.all([
    product.category_id
      ? supabase.from("categories").select("*").eq("id", product.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("products").select("availability_status").eq("id", product.id).single(),
    supabase.from("product_images").select("*").eq("product_id", product.id).order("sort_order"),
    supabase.from("product_documents").select("*").eq("product_id", product.id),
    supabase
      .from("product_compatibility")
      .select("*, equipment_type:equipment_types(*)")
      .eq("product_id", product.id),
    supabase
      .from("product_recommendations")
      .select(`*, recommended_product:products!product_recommendations_recommended_product_id_fkey(${PRODUCT_LIST_SELECT})`)
      .eq("product_id", product.id)
      .order("priority", { ascending: true }),
    supabase
      .from("product_bundle_items")
      .select(`*, component_product:products!product_bundle_items_component_product_id_fkey(${PRODUCT_LIST_SELECT})`)
      .eq("bundle_product_id", product.id),
  ]);

  const recommendationsWithItems = (recommendations ?? []) as unknown as (Database["public"]["Tables"]["product_recommendations"]["Row"] & {
    recommended_product: RawProductListRow | null;
  })[];
  const bundleItemsWithProducts = (bundleItems ?? []) as unknown as (Database["public"]["Tables"]["product_bundle_items"]["Row"] & {
    component_product: RawProductListRow | null;
  })[];

  return {
    ...product,
    category: category ?? null,
    availability_status: parseAvailabilityStatus(
      (availabilityRow as { availability_status: string | null } | null)?.availability_status,
    ),
    images: images ?? [],
    documents: documents ?? [],
    compatibility: (compatibility ?? []) as ProductDetail["compatibility"],
    recommendations: recommendationsWithItems.map((r) => ({
      ...r,
      recommended_product: r.recommended_product ? toListItem(r.recommended_product) : null,
    })),
    bundle_items: bundleItemsWithProducts.map((b) => ({
      ...b,
      component_product: b.component_product ? toListItem(b.component_product) : null,
    })),
  };
}
