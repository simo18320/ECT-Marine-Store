import type { StockStatus } from "@/lib/inventory/rules";

export type MatchTier = "exact" | "category";

export interface RankableCandidate {
  matchTier: MatchTier;
  availabilityStatus: StockStatus;
  sellingPrice: number;
}

const TIER_RANK: Record<MatchTier, number> = { exact: 0, category: 1 };
const STOCK_RANK: Record<StockStatus, number> = { in_stock: 0, low_stock: 0, out_of_stock: 1 };

/**
 * business-rules.md §5: ranked by exact compatibility match > category fit > in-stock > price.
 * A stable sort keeps ties (e.g. two equally-ranked candidates) in their original order rather
 * than shuffling them, which matters for reproducibility in the exit-criteria test scenarios.
 */
export function rankCandidates<T extends RankableCandidate>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => {
    const tierDiff = TIER_RANK[a.matchTier] - TIER_RANK[b.matchTier];
    if (tierDiff !== 0) return tierDiff;

    const stockDiff = STOCK_RANK[a.availabilityStatus] - STOCK_RANK[b.availabilityStatus];
    if (stockDiff !== 0) return stockDiff;

    return a.sellingPrice - b.sellingPrice;
  });
}
