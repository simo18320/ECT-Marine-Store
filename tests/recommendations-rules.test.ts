import { describe, expect, it } from "vitest";
import { rankCandidates } from "@/lib/recommendations/rules";

describe("rankCandidates", () => {
  it("ranks exact matches before category-fit matches regardless of price", () => {
    const ranked = rankCandidates([
      { id: "cheap-category", matchTier: "category", availabilityStatus: "in_stock", sellingPrice: 5 },
      { id: "expensive-exact", matchTier: "exact", availabilityStatus: "in_stock", sellingPrice: 500 },
    ] as const);
    expect(ranked.map((r) => r.id)).toEqual(["expensive-exact", "cheap-category"]);
  });

  it("within the same tier, ranks in-stock before out-of-stock", () => {
    const ranked = rankCandidates([
      { id: "out-of-stock", matchTier: "category", availabilityStatus: "out_of_stock", sellingPrice: 1 },
      { id: "in-stock", matchTier: "category", availabilityStatus: "in_stock", sellingPrice: 100 },
    ] as const);
    expect(ranked.map((r) => r.id)).toEqual(["in-stock", "out-of-stock"]);
  });

  it("treats low_stock the same as in_stock for ranking purposes (both are purchasable)", () => {
    const ranked = rankCandidates([
      { id: "low-stock", matchTier: "category", availabilityStatus: "low_stock", sellingPrice: 50 },
      { id: "in-stock", matchTier: "category", availabilityStatus: "in_stock", sellingPrice: 10 },
    ] as const);
    // Same stock rank -> falls through to price.
    expect(ranked.map((r) => r.id)).toEqual(["in-stock", "low-stock"]);
  });

  it("within the same tier and stock rank, ranks cheaper first", () => {
    const ranked = rankCandidates([
      { id: "pricier", matchTier: "exact", availabilityStatus: "in_stock", sellingPrice: 90 },
      { id: "cheaper", matchTier: "exact", availabilityStatus: "in_stock", sellingPrice: 30 },
    ] as const);
    expect(ranked.map((r) => r.id)).toEqual(["cheaper", "pricier"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      { id: "a", matchTier: "category" as const, availabilityStatus: "in_stock" as const, sellingPrice: 10 },
      { id: "b", matchTier: "exact" as const, availabilityStatus: "in_stock" as const, sellingPrice: 20 },
    ];
    const originalOrder = input.map((i) => i.id);
    rankCandidates(input);
    expect(input.map((i) => i.id)).toEqual(originalOrder);
  });
});
