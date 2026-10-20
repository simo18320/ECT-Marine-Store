import type { ProductListItem } from "@/lib/products/queries";

/**
 * What Claude pulls out of a free-text request. Everything is optional: the customer may only
 * give a size, or only a problem. These are search hints, never facts about a product — products
 * still come only from the catalogue and are ranked against the hints below.
 */
export interface SearchCriteria {
  keywords: string[];
  size: string | null; // as written on the product, e.g. 10" or 4.5" x 20" (Big Blue)
  micron: number | null;
}

export const EMPTY_CRITERIA: SearchCriteria = { keywords: [], size: null, micron: null };

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9"x.]+/g, " ").trim();

/** "10 inch", "10in", `10"` all mean the same spec value. */
export function normaliseSize(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const compact = raw.toLowerCase().replace(/\s+/g, "");
  const m = /^(\d+(?:\.\d+)?)(?:"|in|inch|inches)?$/.exec(compact);
  return m ? `${m[1]}"` : raw.trim();
}

function sizeMatches(productSize: unknown, wanted: string): boolean {
  if (typeof productSize !== "string") return false;
  const p = productSize.replace(/\s+/g, "").toLowerCase();
  const w = wanted.replace(/\s+/g, "").toLowerCase();
  // `10"` must match `10"` but not `2.5" x 10"`: compare the leading size token exactly.
  return p === w || p.startsWith(`${w}(`) || p.startsWith(`${w} `);
}

export function scoreProduct(product: ProductListItem, criteria: SearchCriteria): number {
  const specs = (product.technical_specs as Record<string, unknown>) ?? {};
  const text = normalise(`${product.name} ${product.short_description ?? ""} ${product.sku}`);
  let score = 0;
  for (const keyword of criteria.keywords) {
    const k = normalise(keyword);
    if (k && text.includes(k)) score += 2;
  }
  if (criteria.size) score += sizeMatches(specs.size, criteria.size) ? 4 : specs.size !== undefined ? -2 : 0;
  if (criteria.micron !== null) {
    score += Number(specs.micron_rating) === criteria.micron ? 4 : specs.micron_rating !== undefined ? -2 : 0;
  }
  if (product.availability_status === "out_of_stock") score -= 1;
  return score;
}

/** Best matches first; ties keep the original (alphabetical) order. Drops anything that scores no better than nothing. */
export function rankProducts(products: ProductListItem[], criteria: SearchCriteria, limit = 8): ProductListItem[] {
  return products
    .map((product, index) => ({ product, index, score: scoreProduct(product, criteria) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map((r) => r.product);
}

/** A websearch query that matches ANY keyword — the AND-of-every-word default returns nothing for natural sentences. */
export function toOrQuery(criteria: SearchCriteria): string {
  return criteria.keywords
    .map((k) => k.trim())
    .filter(Boolean)
    .map((k) => (k.includes(" ") ? `"${k}"` : k))
    .join(" or ");
}
