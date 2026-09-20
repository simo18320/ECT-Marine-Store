import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";
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
  variants: ProductVariantOption[];
}

// A sibling in the same variant_group_id — same filter type, different size/class. Just enough
// to populate a size selector and jump straight to that sibling's own page.
export interface ProductVariantOption {
  id: string;
  slug: string;
  selling_price: number;
  vat_rate: number;
  technical_specs: Json;
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
  filterClass?: string;
  samplingType?: string;
  investigation?: string;
  application?: string;
}

export interface ProductSpecFacets {
  sizes: string[];
  microns: string[];
  uses: string[];
  filterTypes: string[];
  filterClasses: string[];
  samplingTypes: string[];
  investigations: string[];
  applications: string[];
}

// A spec value that names one option (size, filter_class, sampling_type, ...) vs. one that
// names several at once (a sampling kit covers multiple investigations/applications) — both
// need to feed the same faceting and filtering logic without the single-value facets having to
// know arrays exist.
function addSpecValues(set: Set<string>, raw: unknown) {
  if (typeof raw === "string") set.add(raw);
  else if (Array.isArray(raw)) for (const v of raw) if (typeof v === "string") set.add(v);
}
function specMatches(raw: unknown, wanted: string): boolean {
  if (typeof raw === "string") return raw === wanted;
  if (Array.isArray(raw)) return raw.includes(wanted);
  return false;
}

function facetsFromSpecsList(specsList: Json[]): ProductSpecFacets {
  const sizes = new Set<string>();
  const microns = new Set<string>();
  const uses = new Set<string>();
  const filterTypes = new Set<string>();
  const filterClasses = new Set<string>();
  const samplingTypes = new Set<string>();
  const investigations = new Set<string>();
  const applications = new Set<string>();

  for (const raw of specsList) {
    const specs = (raw as Record<string, unknown>) ?? {};
    if (typeof specs.size === "string") sizes.add(specs.size);
    if (specs.micron_rating != null) microns.add(String(specs.micron_rating));
    if (typeof specs.use === "string") uses.add(specs.use);
    if (typeof specs.filter_type === "string") filterTypes.add(specs.filter_type);
    if (typeof specs.filter_class === "string") filterClasses.add(specs.filter_class);
    if (typeof specs.sampling_type === "string") samplingTypes.add(specs.sampling_type);
    addSpecValues(investigations, specs.investigation);
    addSpecValues(applications, specs.application);
  }

  return {
    sizes: [...sizes].sort(),
    microns: [...microns].sort((a, b) => Number(a) - Number(b)),
    uses: [...uses].sort(),
    filterTypes: [...filterTypes].sort(),
    filterClasses: [...filterClasses].sort(),
    samplingTypes: [...samplingTypes].sort(),
    investigations: [...investigations].sort(),
    applications: [...applications].sort(),
  };
}

/** Distinct values actually present in this result set, for populating the storefront filter
 * dropdowns — computed from the same list the page already fetched, before the facet filters
 * are applied, so a dropdown never offers an option that would zero out the results. */
export function getSpecFacets(items: ProductListItem[]): ProductSpecFacets {
  return facetsFromSpecsList(items.map((item) => item.technical_specs));
}

// Same in-memory filtering approach as inStockOnly below — the catalogue is small enough that
// fetching a category/search result set and filtering in JS is simpler and safer than building
// dynamic JSONB-path query strings for these optional, independent facets.
function applySpecFilters(items: ProductListItem[], filters: ProductFilters): ProductListItem[] {
  return items.filter((p) => {
    const specs = (p.technical_specs as Record<string, unknown>) ?? {};
    if (filters.size && specs.size !== filters.size) return false;
    if (filters.micron && String(specs.micron_rating) !== filters.micron) return false;
    if (filters.use && specs.use !== filters.use) return false;
    if (filters.filterType && specs.filter_type !== filters.filterType) return false;
    if (filters.filterClass && specs.filter_class !== filters.filterClass) return false;
    if (filters.samplingType && specs.sampling_type !== filters.samplingType) return false;
    if (filters.investigation && !specMatches(specs.investigation, filters.investigation)) return false;
    if (filters.application && !specMatches(specs.application, filters.application)) return false;
    return true;
  });
}

// A branch category (Water, Air, ...) has no products of its own — every real product sits on a
// leaf several levels down — so browsing or filtering "by category" has to mean the whole subtree,
// not an exact category_id match, or a branch page/mega-menu shortcut would always come back empty.
export async function getCategorySubtreeIds(categoryId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, parent_id");
  if (!categories) return [categoryId];

  const childrenByParent = new Map<string, string[]>();
  for (const c of categories) {
    if (c.parent_id) childrenByParent.set(c.parent_id, [...(childrenByParent.get(c.parent_id) ?? []), c.id]);
  }
  function collect(id: string): string[] {
    return [id, ...(childrenByParent.get(id) ?? []).flatMap(collect)];
  }
  return collect(categoryId);
}

export async function getProductsByCategoryId(
  categoryId: string | string[],
  filters: ProductFilters = {},
): Promise<ProductListItem[]> {
  const supabase = await createClient();
  let query = supabase.from("products").select(PRODUCT_LIST_SELECT).eq("is_active", true);
  query = Array.isArray(categoryId) ? query.in("category_id", categoryId) : query.eq("category_id", categoryId);
  const { data, error } = await query.order("name", { ascending: true });

  if (error || !data) return [];

  let items = (data as unknown as RawProductListRow[]).map(toListItem);
  if (filters.inStockOnly) items = items.filter((p) => p.availability_status !== "out_of_stock");
  return applySpecFilters(items, filters);
}

// Per top-level category (Water, Air, ...), the distinct filter values found anywhere in its
// subtree — powers the mega-menu's filter shortcuts (e.g. "20 micron" under Water) so picking one
// jumps straight to matching products instead of drilling through a category tree first.
export async function getTopLevelCategoryFacets(): Promise<Record<string, ProductSpecFacets>> {
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, slug, parent_id"),
    supabase.from("products").select("category_id, technical_specs").eq("is_active", true),
  ]);
  if (!categories) return {};

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  function topLevelSlugFor(categoryId: string | null): string | null {
    let current = categoryId ? categoryById.get(categoryId) : undefined;
    while (current?.parent_id) current = categoryById.get(current.parent_id);
    return current?.slug ?? null;
  }

  const buckets = new Map<string, Json[]>();
  for (const p of products ?? []) {
    const topSlug = topLevelSlugFor(p.category_id);
    if (!topSlug) continue;
    buckets.set(topSlug, [...(buckets.get(topSlug) ?? []), p.technical_specs]);
  }

  const result: Record<string, ProductSpecFacets> = {};
  for (const [slug, specsList] of buckets) {
    result[slug] = facetsFromSpecsList(specsList);
  }
  return result;
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
    { data: variantSiblings },
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
    product.variant_group_id
      ? supabase
          .from("products")
          .select("id, slug, selling_price, vat_rate, technical_specs")
          .eq("variant_group_id", product.variant_group_id)
          .eq("is_active", true)
          .order("selling_price", { ascending: true })
      : Promise.resolve({ data: null }),
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
    variants: (variantSiblings ?? []) as unknown as ProductVariantOption[],
  };
}
