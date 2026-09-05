import { describe, expect, it } from "vitest";
import { computeLandedCost, isEligibleForOrder, rankQuotes, type QuoteForScoring, type ScoringWeights } from "@/lib/suppliers/rules";

describe("isEligibleForOrder", () => {
  it("rejects discovered and under_review suppliers", () => {
    expect(isEligibleForOrder("discovered")).toBe(false);
    expect(isEligibleForOrder("under_review")).toBe(false);
  });

  it("accepts qualified, approved, and preferred suppliers", () => {
    expect(isEligibleForOrder("qualified")).toBe(true);
    expect(isEligibleForOrder("approved")).toBe(true);
    expect(isEligibleForOrder("preferred")).toBe(true);
  });

  it("rejects a blocked supplier", () => {
    expect(isEligibleForOrder("blocked")).toBe(false);
  });
});

describe("computeLandedCost", () => {
  it("is null when shipping is missing", () => {
    expect(computeLandedCost({ unitPrice: 10, shippingCost: null, dutiesCost: 2, handlingCost: null })).toBeNull();
  });

  it("is null when both duties and handling are missing", () => {
    expect(computeLandedCost({ unitPrice: 10, shippingCost: 3, dutiesCost: null, handlingCost: null })).toBeNull();
  });

  it("computes the sum once shipping and at least one of duties/handling are known", () => {
    expect(computeLandedCost({ unitPrice: 10, shippingCost: 3, dutiesCost: 2, handlingCost: null })).toBe(15);
    expect(computeLandedCost({ unitPrice: 10, shippingCost: 3, dutiesCost: null, handlingCost: 1 })).toBe(14);
    expect(computeLandedCost({ unitPrice: 10, shippingCost: 3, dutiesCost: 2, handlingCost: 1 })).toBe(16);
  });
});

const weights: ScoringWeights = {
  price: 0.3,
  leadTime: 0.2,
  quality: 0.2,
  reliability: 0.15,
  moq: 0.05,
  shipping: 0.05,
  paymentTerms: 0.05,
};

function quote(overrides: Partial<QuoteForScoring> & { id: string }): QuoteForScoring {
  return {
    unitPrice: 100,
    leadTimeDays: 10,
    moq: null,
    shippingCost: 10,
    paymentTerms: "Net 30",
    supplierStatus: "qualified",
    supplierQualityScore: 80,
    supplierReliabilityScore: 80,
    ...overrides,
  };
}

describe("rankQuotes", () => {
  it("ranks the cheaper, faster, better-rated quote first", () => {
    const ranked = rankQuotes(
      [
        quote({ id: "weak", unitPrice: 150, leadTimeDays: 20, supplierQualityScore: 40, supplierReliabilityScore: 40 }),
        quote({ id: "strong", unitPrice: 100, leadTimeDays: 5, supplierQualityScore: 90, supplierReliabilityScore: 90 }),
      ],
      weights,
      10,
    );
    expect(ranked.map((q) => q.id)).toEqual(["strong", "weak"]);
    expect(ranked[0].labels).toEqual(expect.arrayContaining(["BEST_PRICE", "FASTEST", "BEST_VALUE"]));
  });

  it("labels PREFERRED_SUPPLIER only for a preferred-status supplier", () => {
    const ranked = rankQuotes(
      [quote({ id: "a", supplierStatus: "qualified" }), quote({ id: "b", supplierStatus: "preferred" })],
      weights,
      10,
    );
    const preferred = ranked.find((q) => q.id === "b")!;
    const qualified = ranked.find((q) => q.id === "a")!;
    expect(preferred.labels).toContain("PREFERRED_SUPPLIER");
    expect(qualified.labels).not.toContain("PREFERRED_SUPPLIER");
  });

  it("treats a missing quality/reliability rating as worst-case, not neutral", () => {
    const ranked = rankQuotes(
      [
        quote({ id: "rated", supplierQualityScore: 50, supplierReliabilityScore: 50 }),
        quote({ id: "unrated", supplierQualityScore: null, supplierReliabilityScore: null }),
      ],
      weights,
      10,
    );
    const rated = ranked.find((q) => q.id === "rated")!;
    const unrated = ranked.find((q) => q.id === "unrated")!;
    expect(rated.score).toBeGreaterThan(unrated.score);
  });

  it("scores a MOQ at or below the requested quantity as a perfect fit regardless of size", () => {
    const ranked = rankQuotes(
      [quote({ id: "no-moq", moq: null }), quote({ id: "fits", moq: 10 })],
      weights,
      10,
    );
    // Identical on every other factor -> identical score once MOQ fit is capped at 100 for both.
    expect(ranked.find((q) => q.id === "no-moq")!.score).toBe(ranked.find((q) => q.id === "fits")!.score);
  });

  it("penalizes a MOQ above the requested quantity proportionally", () => {
    const ranked = rankQuotes(
      [quote({ id: "fits", moq: 10 }), quote({ id: "over", moq: 100 })],
      weights,
      10,
    );
    expect(ranked.find((q) => q.id === "fits")!.score).toBeGreaterThan(ranked.find((q) => q.id === "over")!.score);
  });

  it("returns an empty array for no quotes", () => {
    expect(rankQuotes([], weights, 10)).toEqual([]);
  });
});
