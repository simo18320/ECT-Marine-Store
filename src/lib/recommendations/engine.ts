import { createClient } from "@/lib/supabase/server";
import { getProblem } from "./problems";
import { rankCandidates, type MatchTier } from "./rules";
import { PRODUCT_LIST_SELECT, toListItem, type ProductListItem, type RawProductListRow } from "@/lib/products/queries";

export interface RecommendationResult {
  product: ProductListItem;
  matchTier: MatchTier;
  ruleSource: string;
  reason: string;
}

interface CompatibilityRow {
  compatible_manufacturer: string | null;
  compatible_model: string | null;
  source: string;
  product: RawProductListRow | null;
}

/**
 * business-rules.md §5, the deterministic recommendation engine:
 *   problem -> equipment_type(s) -> (optionally) equipment actually on the customer's yacht
 *   -> product_compatibility rows passing §4 -> ranked exact > category > in-stock > price.
 * Pure lookup + ranking, no AI involved — an AI layer (Phase 8) may explain this output in
 * natural language but must never add a product absent from it (ai-engine.md §3).
 */
export async function getRecommendationsForProblem(
  problemId: string,
  yachtId?: string,
): Promise<RecommendationResult[]> {
  const problem = getProblem(problemId);
  if (!problem) return [];

  const supabase = await createClient();

  const { data: types } = await supabase
    .from("equipment_types")
    .select("id, name")
    .in("name", problem.equipmentTypeNames);
  const typeIds = (types ?? []).map((t) => t.id);
  if (typeIds.length === 0) return [];

  // If the customer's yacht is known, find manufacturer/model pairs actually installed, so an
  // exact match can be distinguished from a merely category-compatible product.
  let yachtEquipment: { manufacturer: string | null; model: string | null }[] = [];
  if (yachtId) {
    const { data } = await supabase
      .from("equipment")
      .select("manufacturer, model")
      .eq("yacht_id", yachtId)
      .in("equipment_type_id", typeIds);
    yachtEquipment = data ?? [];
  }

  const { data: compatRows } = await supabase
    .from("product_compatibility")
    .select(
      `compatible_manufacturer, compatible_model, source, product:products(${PRODUCT_LIST_SELECT})`,
    )
    .in("equipment_type_id", typeIds)
    // business-rules.md §4: only ECT-verified/manufacturer-documented rows, or a manually
    // entered row that has actually been signed off by a staff member.
    .or("source.eq.ect_verified,source.eq.manufacturer_doc,and(source.eq.manual_entry,verified_by.not.is.null)");

  const byProduct = new Map<string, RecommendationResult>();

  for (const row of (compatRows ?? []) as unknown as CompatibilityRow[]) {
    const rawProduct = row.product;
    if (!rawProduct || !rawProduct.is_active) continue;

    const isExactMatch = yachtEquipment.some(
      (installed) =>
        row.compatible_manufacturer &&
        installed.manufacturer &&
        row.compatible_manufacturer.toLowerCase() === installed.manufacturer.toLowerCase() &&
        (!row.compatible_model ||
          !installed.model ||
          row.compatible_model.toLowerCase() === installed.model.toLowerCase()),
    );
    const matchTier: MatchTier = isExactMatch ? "exact" : "category";

    // A product can have more than one matching compatibility row; keep the best tier seen.
    const existing = byProduct.get(rawProduct.id);
    if (existing && existing.matchTier === "exact") continue;

    byProduct.set(rawProduct.id, {
      product: toListItem(rawProduct),
      matchTier,
      ruleSource: row.source,
      reason: isExactMatch
        ? `Verified compatible with the ${row.compatible_manufacturer} equipment on your yacht.`
        : `Compatible with your ${problem.equipmentTypeNames.join("/")} equipment.`,
    });
  }

  const ranked = rankCandidates(
    Array.from(byProduct.values()).map((r) => ({
      ...r,
      availabilityStatus: r.product.availability_status,
      sellingPrice: r.product.selling_price,
    })),
  );

  return ranked.slice(0, 8);
}

export interface SuggestedProductType {
  category: { id: string; name: string; slug: string };
  products: ProductListItem[];
}

/**
 * Category-level "what type of product handles this" suggestion for a problem — independent of
 * product_compatibility data, which only exists for some products so far. Never claims verified
 * compatibility (that's what getRecommendationsForProblem is for); it's just a starting point for
 * browsing, labelled as such wherever it's rendered.
 *
 * Deliberately an exact category_id match, not the subtree: each slug in suggestedCategorySlugs is
 * hand-picked to be exactly the node the products live on (e.g. "water-reverse-osmosis" itself
 * holds the sellable puRO systems, while its child "ro-membranes" holds spare membranes) — a
 * branch category that should surface several of its children lists each of those slugs directly
 * rather than relying on subtree expansion, which would otherwise let a handful of consumables
 * crowd the real product out of the capped result.
 *
 * Category order follows suggestedCategorySlugs (not the DB's own return order), so listing
 * "uv-lamps" before "uv-systems" is what puts the lamps section above the sterilizer-systems one.
 * Within a category, control units/starters (accessories you'd only buy for a system you already
 * own, never the thing that actually addresses the problem) are pushed after the primary products
 * rather than sorted alphabetically, so they don't crowd out the real product in the capped preview.
 */
const DEPRIORITIZED_NAME_PATTERN = /\b(control unit|starter)\b/i;

export async function getSuggestedProductTypes(problemId: string): Promise<SuggestedProductType[]> {
  const problem = getProblem(problemId);
  if (!problem) return [];

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .in("slug", problem.suggestedCategorySlugs);
  if (!categories) return [];

  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));

  const results: SuggestedProductType[] = [];
  for (const slug of problem.suggestedCategorySlugs) {
    const category = categoryBySlug.get(slug);
    if (!category) continue;

    const { data } = await supabase
      .from("products")
      .select(PRODUCT_LIST_SELECT)
      .eq("is_active", true)
      .eq("category_id", category.id)
      .order("name");
    const products = ((data ?? []) as unknown as RawProductListRow[])
      .map(toListItem)
      .sort((a, b) => Number(DEPRIORITIZED_NAME_PATTERN.test(a.name)) - Number(DEPRIORITIZED_NAME_PATTERN.test(b.name)))
      .slice(0, 4);
    if (products.length > 0) results.push({ category, products });
  }
  return results;
}
