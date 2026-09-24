import { describe, expect, it } from "vitest";
import {
  amountToUnlockFreeShipping,
  calculateShipping,
  countsTowardsProfitability,
  marginStatus,
  profitFromStored,
  type EngineInput,
  type EngineLine,
  type EngineProduct,
  type EngineSettings,
  type RateTable,
} from "@/lib/shipping/engine";
import { aggregateProducts, aggregateShipping, type AnalyticsItem, type AnalyticsOrder } from "@/lib/shipping/analytics";

const settings: EngineSettings = {
  defaultMinimumNetMarginPercent: 30,
  freeShippingTarget: 150,
  paymentFeePercent: 2.9,
  paymentFixedFee: 0.3,
  defaultPackagingCost: 1.5,
  includedWeightKg: 10,
  handlingFeePerExtraKg: 0,
};

const fixed = (customerCharge: number) => ({ mode: "fixed" as const, customerCharge, ectCost: customerCharge });
const quote = { mode: "quote" as const, customerCharge: null, ectCost: null };
const rates: RateTable = {
  IT: { A: fixed(9.9), B: fixed(14.9), C: quote, D: quote },
  EU: { A: fixed(14.9), B: fixed(19.9), C: quote, D: quote },
  UK: { A: fixed(19.9), B: fixed(29.9), C: quote, D: quote },
  INT: { A: quote, B: quote, C: quote, D: quote },
};

function product(overrides: Partial<EngineProduct> = {}): EngineProduct {
  return {
    id: "p",
    shippingClass: "A",
    purchaseCost: 50,
    weightKg: 1,
    packagingCost: null,
    freeShippingEligible: true,
    minimumMarginPercent: null,
    minimumMarginAmount: null,
    specialShippingRequired: false,
    shippingOverride: false,
    shippingOverrideCost: null,
    shippingCostByZone: {},
    ...overrides,
  };
}

// unitPriceNet 100 / 22% VAT -> 122 gross per unit
const line = (p: Partial<EngineProduct> = {}, quantity = 1, unitPriceNet = 100): EngineLine => ({
  product: product(p),
  quantity,
  unitPriceNet,
  vatRate: 22,
});

const run = (lines: EngineLine[], extra: Partial<EngineInput> = {}) =>
  calculateShipping({ lines, country: "Italia", settings, rates, ...extra });

describe("shipping classes and zones", () => {
  it("charges class A and B tariffs in Italy (net, VAT on top)", () => {
    const a = run([line({ shippingClass: "A" })]);
    expect(a.customerShippingNet).toBe(9.9);
    expect(a.customerShippingVat).toBe(2.18);
    const b = run([line({ shippingClass: "B" })]);
    expect(b.customerShippingNet).toBe(14.9);
  });

  it("requires a quotation for class C and D", () => {
    expect(run([line({ shippingClass: "C" })]).quoteRequired).toBe(true);
    const d = run([line({ shippingClass: "D" })]);
    expect(d.quoteRequired).toBe(true);
    expect(d.freeShipping).toBe(false);
  });

  it("uses EU and UK online rates for A/B and flags UK duties", () => {
    expect(run([line()], { country: "France" }).customerShippingNet).toBe(14.9);
    const uk = run([line({ shippingClass: "B" })], { country: "United Kingdom" });
    expect(uk.customerShippingNet).toBe(29.9);
    expect(uk.dutiesNotice).toBe(true);
    expect(run([line()], { country: "France" }).dutiesNotice).toBe(false);
  });

  it("quotes the rest of the world and the US", () => {
    expect(run([line()], { country: "Japan" }).quoteRequired).toBe(true);
    expect(run([line()], { country: "United States" }).destination).toBe("US");
    expect(run([line()], { country: "United States" }).quoteRequired).toBe(true);
  });

  it("quotes special shipping products", () => {
    expect(run([line({ specialShippingRequired: true })]).quoteRequired).toBe(true);
  });
});

describe("mixed carts", () => {
  it("uses the highest class in the cart", () => {
    const r = run([line({ shippingClass: "A" }, 1, 40), line({ shippingClass: "B" }, 1, 40)]);
    expect(r.appliedClass).toBe("B");
    expect(r.customerShippingNet).toBe(14.9);
  });

  it("any quote-only class makes the whole cart a quote", () => {
    expect(run([line({ shippingClass: "A" }), line({ shippingClass: "D" })]).quoteRequired).toBe(true);
  });

  it("adds the weight handling fee above the included kilos", () => {
    const heavy = run([line({ weightKg: 6, freeShippingEligible: false }, 3)], {
      settings: { ...settings, handlingFeePerExtraKg: 1 },
    });
    // 18 kg, 10 included -> 8 extra
    expect(heavy.customerShippingNet).toBe(17.9);
    expect(heavy.profitability?.ectShippingCost).toBe(17.9);
  });
});

describe("free shipping is decided by margin, not just value", () => {
  it("grants it when above target and the margin holds", () => {
    const r = run([line({ purchaseCost: 50 })]); // gross 122 < 150
    expect(r.freeShipping).toBe(false);
    const big = run([line({ purchaseCost: 50 }, 2)]); // gross 244
    expect(big.freeShipping).toBe(true);
    expect(big.customerShippingNet).toBe(0);
    expect(big.profitability?.shippingSubsidy).toBe(9.9);
  });

  it("denies it when the order is above target but the margin would fall below the minimum", () => {
    const r = run([line({ purchaseCost: 85 }, 2)]); // gross 244, thin margin
    expect(r.freeShipping).toBe(false);
    expect(r.freeDeniedReason).toMatch(/minimum margin/);
    expect(r.customerShippingNet).toBe(9.9);
  });

  it("denies free shipping exactly one cent under the target and grants it exactly at it", () => {
    const under = run([line({ purchaseCost: 10 }, 1, 122.9)]); // gross 149.94
    expect(under.freeShipping).toBe(false);
    const at = run([line({ purchaseCost: 10 }, 1, 122.95)]); // gross 150.00
    expect(at.goodsGross).toBe(150);
    expect(at.freeShipping).toBe(true);
  });

  it("respects a product-specific minimum margin", () => {
    const r = run([line({ purchaseCost: 50, minimumMarginPercent: 60 }, 2)]);
    expect(r.freeShipping).toBe(false);
  });

  it("respects a product minimum margin amount", () => {
    const r = run([line({ purchaseCost: 50, minimumMarginAmount: 500 }, 2)]);
    expect(r.freeShipping).toBe(false);
  });

  it("never gives free shipping to non-eligible products, class C, or overridden products", () => {
    expect(run([line({ freeShippingEligible: false }, 3)]).freeShipping).toBe(false);
    expect(run([line({ shippingClass: "C" }, 3)]).freeShipping).toBe(false);
    const o = run([line({ shippingOverride: true, shippingOverrideCost: 25 }, 3)]);
    expect(o.freeShipping).toBe(false);
    expect(o.customerShippingNet).toBe(25);
  });

  it("evaluates free shipping after discounts", () => {
    const full = run([line({ purchaseCost: 30 }, 2)]);
    expect(full.freeShipping).toBe(true);
    // 244 gross, 40 net discount -> 195.2 gross, still above target
    expect(run([line({ purchaseCost: 30 }, 2)], { discountNet: 40 }).freeShipping).toBe(true);
    // 100 net discount -> gross 146.4 < 150
    const r = run([line({ purchaseCost: 30 }, 2)], { discountNet: 100 });
    expect(r.freeShipping).toBe(false);
    expect(r.goodsGross).toBeLessThan(150);
  });

  it("applies free shipping to EU orders only when the margin holds there too", () => {
    const r = run([line({ purchaseCost: 50 }, 2)], { country: "Germany" });
    expect(r.freeShipping).toBe(true);
    expect(r.profitability?.shippingSubsidy).toBe(14.9);
  });
});

describe("fail-safe data handling", () => {
  it("never grants free shipping and flags missing cost data", () => {
    const r = run([line({ purchaseCost: null }, 3)]);
    expect(r.flags).toContain("MISSING_COST_DATA");
    expect(r.freeShipping).toBe(false);
    expect(r.profitability?.status).toBe("UNRELIABLE");
    expect(r.profitability?.netMarginPercent).toBeNull();
  });

  it("treats a zero cost as missing rather than as a 100% margin", () => {
    const r = run([line({ purchaseCost: 0 }, 3)]);
    expect(r.flags).toContain("MISSING_COST_DATA");
    expect(r.freeShipping).toBe(false);
  });

  it("prices a product with no class as class B and never gives it free shipping", () => {
    const r = run([line({ shippingClass: null }, 3)]);
    expect(r.flags).toContain("MISSING_SHIPPING_CLASS");
    expect(r.appliedClass).toBe("B");
    expect(r.freeShipping).toBe(false);
  });

  it("flags missing weight without blocking the order", () => {
    const r = run([line({ weightKg: null })]);
    expect(r.flags).toContain("MISSING_WEIGHT");
    expect(r.quoteRequired).toBe(false);
  });
});

describe("profitability", () => {
  it("uses revenue excluding VAT as the margin basis", () => {
    const r = run([line({ purchaseCost: 60 })]);
    const p = r.profitability!;
    expect(p.revenueNet).toBe(109.9); // 100 goods + 9.90 shipping
    expect(p.vatTotal).toBe(24.18); // 22 + 2.18
    expect(p.revenueGross).toBe(134.08);
    // fee on the gross paid: 134.08 * 2.9% + 0.30 = 4.19
    expect(p.paymentFee).toBe(4.19);
    expect(p.packagingCost).toBe(1.5);
    // 109.90 - 60 - 9.90 - 4.19 - 1.50
    expect(p.netProfit).toBe(34.31);
    expect(p.netMarginPercent).toBe(31.22);
    expect(p.status).toBe("SAFE");
  });

  it("marks an order below cost as LOSS and names the driver", () => {
    const r = run([line({ purchaseCost: 99 })], { adminOverridePrice: 0 });
    expect(r.profitability?.status).toBe("LOSS");
    expect(r.profitability?.lossDrivers.length).toBeGreaterThan(0);
  });

  it("classifies margin status bands", () => {
    expect(marginStatus(-0.01, 30)).toBe("LOSS");
    expect(marginStatus(0, 30)).toBe("WARNING");
    expect(marginStatus(29.99, 30)).toBe("WARNING");
    expect(marginStatus(30, 30)).toBe("SAFE");
  });

  it("packaging is the largest per-product packaging, or the default", () => {
    expect(run([line({ packagingCost: 4 }), line({ packagingCost: null })]).profitability?.packagingCost).toBe(4);
  });

  it("the shipping cost is a pure cost when the customer pays zero", () => {
    const r = run([line({ purchaseCost: 30 }, 2)]);
    expect(r.profitability?.customerShippingNet).toBe(0);
    expect(r.profitability?.ectShippingCost).toBe(9.9);
  });

  it("a zero shipping cost class does not break the maths", () => {
    const zeroRates: RateTable = { ...rates, IT: { ...rates.IT, A: { mode: "fixed", customerCharge: 0, ectCost: 0 } } };
    const r = run([line({ purchaseCost: 30 }, 2)], { rates: zeroRates });
    expect(r.freeShipping).toBe(true);
    expect(r.profitability?.shippingSubsidy).toBe(0);
  });

  it("recomputes profitability when the shipping charged is overridden", () => {
    const base = run([line({ purchaseCost: 60 })]).profitability!;
    const updated = profitFromStored({
      productRevenueNet: base.productRevenueNet,
      productCost: base.productCost,
      ectShippingCost: base.ectShippingCost,
      paymentFee: base.paymentFee,
      packagingCost: base.packagingCost,
      customerShippingNet: 0,
      minMarginPercent: 30,
    });
    expect(updated.shippingSubsidy).toBe(9.9);
    expect(updated.netProfit).toBeLessThan(base.netProfit as number);
  });

  it("only paid-through orders count in analytics", () => {
    expect(["paid", "processing", "shipped", "delivered"].every(countsTowardsProfitability)).toBe(true);
    expect(["pending", "cancelled", "refunded"].some(countsTowardsProfitability)).toBe(false);
  });
});

describe("cart messaging helper", () => {
  it("returns the amount still needed when the cart would qualify at the target", () => {
    expect(amountToUnlockFreeShipping({ lines: [line({ purchaseCost: 30 })], country: "Italia", settings, rates })).toBe(28);
  });

  it("returns null when the margin would not hold even at the target, so no false promise is made", () => {
    expect(amountToUnlockFreeShipping({ lines: [line({ purchaseCost: 95 })], country: "Italia", settings, rates })).toBeNull();
  });

  it("returns null for quotes and for orders already free", () => {
    expect(amountToUnlockFreeShipping({ lines: [line({ shippingClass: "D" })], country: "Italia", settings, rates })).toBeNull();
    expect(amountToUnlockFreeShipping({ lines: [line({ purchaseCost: 30 }, 2)], country: "Italia", settings, rates })).toBeNull();
  });
});

describe("analytics aggregation", () => {
  const order = (id: string, over: Partial<AnalyticsOrder> = {}): AnalyticsOrder => ({
    orderId: id,
    status: "paid",
    freeShipping: false,
    customerShipping: 9.9,
    shippingCost: 9.9,
    shippingSubsidy: 0,
    paymentFee: 3,
    packagingCost: 1.5,
    revenueNet: 100,
    productCost: 50,
    netProfit: 35,
    netMarginPercent: 35,
    minMarginPercent: 30,
    marginStatus: "SAFE",
    ...over,
  });

  it("counts only paid-through orders and computes the KPIs", () => {
    const k = aggregateShipping([
      order("1"),
      order("2", { freeShipping: true, customerShipping: 0, shippingSubsidy: 9.9, netMarginPercent: 20, marginStatus: "WARNING" }),
      order("3", { netMarginPercent: -4, marginStatus: "LOSS" }),
      order("4", { netMarginPercent: null, marginStatus: "UNRELIABLE" }),
      order("5", { status: "cancelled", freeShipping: true }),
      order("6", { status: "refunded" }),
    ]);
    expect(k.totalOrders).toBe(4);
    expect(k.freeShippingOrders).toBe(1);
    expect(k.freeShippingPercent).toBe(25);
    expect(k.totalSubsidy).toBe(9.9);
    expect(k.belowMinMargin).toBe(2);
    expect(k.negativeMargin).toBe(1);
    expect(k.unreliable).toBe(1);
    expect(k.avgNetMarginPercent).toBe(17); // (35 + 20 - 4) / 3, unreliable excluded
  });

  it("shares order-level costs across product lines by revenue and ignores cancelled orders", () => {
    const orders = [order("1", { shippingSubsidy: 10, paymentFee: 4, packagingCost: 2 }), order("2", { status: "cancelled" })];
    const items: AnalyticsItem[] = [
      { orderId: "1", productId: "a", sku: "A", name: "A", quantity: 1, lineTotal: 75, unitCost: 30 },
      { orderId: "1", productId: "b", sku: "B", name: "B", quantity: 2, lineTotal: 25, unitCost: 5 },
      { orderId: "2", productId: "a", sku: "A", name: "A", quantity: 9, lineTotal: 999, unitCost: 30 },
    ];
    const rows = aggregateProducts(orders, items);
    const a = rows.find((r) => r.sku === "A")!;
    expect(a.units).toBe(1);
    expect(a.shippingSubsidy).toBe(7.5);
    expect(a.paymentFees).toBe(3);
    expect(a.netProfit).toBe(75 - 30 - 7.5 - 3 - 1.5);
    const b = rows.find((r) => r.sku === "B")!;
    expect(b.productCost).toBe(10);
    expect(b.shippingSubsidy).toBe(2.5);
  });

  it("marks a product with a missing cost as unreliable instead of profitable", () => {
    const rows = aggregateProducts(
      [order("1")],
      [{ orderId: "1", productId: "a", sku: "A", name: "A", quantity: 1, lineTotal: 100, unitCost: null }],
    );
    expect(rows[0].missingCost).toBe(true);
    expect(rows[0].netProfit).toBeNull();
  });
});
