import { describe, expect, it } from "vitest";
import { computeOrderTotals, generateOrderNumber, toStripeUnitAmount } from "@/lib/orders/rules";
import { computeShipping, isItaly } from "@/lib/orders/shipping";

describe("computeOrderTotals", () => {
  it("sums subtotal and VAT per line at each line's own rate", () => {
    const totals = computeOrderTotals([
      { unitPrice: 16.5, vatRate: 22, quantity: 2 },
      { unitPrice: 9.9, vatRate: 22, quantity: 1 },
    ]);
    expect(totals.subtotal).toBeCloseTo(42.9, 2);
    expect(totals.vatTotal).toBeCloseTo(9.438, 2);
    expect(totals.grandTotal).toBeCloseTo(52.34, 2);
  });

  it("handles mixed VAT rates correctly rather than applying one flat rate", () => {
    const totals = computeOrderTotals([
      { unitPrice: 100, vatRate: 22, quantity: 1 },
      { unitPrice: 100, vatRate: 10, quantity: 1 },
    ]);
    expect(totals.subtotal).toBe(200);
    expect(totals.vatTotal).toBeCloseTo(32, 2);
  });

  it("returns zero totals for an empty cart", () => {
    expect(computeOrderTotals([])).toEqual({ subtotal: 0, vatTotal: 0, grandTotal: 0 });
  });
});

describe("generateOrderNumber", () => {
  it("produces unique, ECT-prefixed order numbers", () => {
    const numbers = new Set(Array.from({ length: 50 }, () => generateOrderNumber()));
    expect(numbers.size).toBe(50);
    for (const n of numbers) expect(n).toMatch(/^ECT-[0-9A-Z]+-[0-9A-Z]{4}$/);
  });
});

describe("toStripeUnitAmount", () => {
  it("returns VAT-inclusive integer cents", () => {
    expect(toStripeUnitAmount(16.5, 22)).toBe(2013);
    expect(toStripeUnitAmount(9.9, 22)).toBe(1208);
  });

  it("rounds to the nearest cent rather than truncating", () => {
    // 10 * 1.15 = 11.5 exactly -> 1150c; guard against float drift producing 1149.
    expect(toStripeUnitAmount(10, 15)).toBe(1150);
  });
});


describe("computeShipping", () => {
  const settings = { freeThreshold: 100, feeItaly: 12.9 };

  it("is free in Italy from the threshold (VAT-inclusive goods total)", () => {
    expect(computeShipping({ goodsGross: 100, country: "Italia", settings }).kind).toBe("free");
    expect(computeShipping({ goodsGross: 250, country: "Italy", settings }).kind).toBe("free");
  });

  it("charges the flat fee plus VAT below the threshold in Italy", () => {
    expect(computeShipping({ goodsGross: 99.99, country: "IT", settings })).toEqual({ kind: "fee", net: 12.9, vat: 2.84 });
  });

  it("requires a quote for any other country, whatever the amount", () => {
    expect(computeShipping({ goodsGross: 500, country: "France", settings }).kind).toBe("quote");
    expect(computeShipping({ goodsGross: 500, country: "", settings }).kind).toBe("quote");
  });

  it("recognises the common spellings of Italy", () => {
    expect(["Italy", " italia ", "IT", "ITA"].every(isItaly)).toBe(true);
    expect(isItaly("Malta")).toBe(false);
  });
});
