import { SHIPPING_VAT_RATE } from "@/lib/orders/shipping";
import { destinationOf, dutiesNotIncluded, rateZoneOf, type Destination, type RateZone } from "./zones";

/**
 * Shipping & Margin engine — pure, no I/O. The server loads products, settings and rates and
 * calls this; nothing here trusts the client. Free shipping is never decided from the order value
 * alone: it is granted only when the order clears the commercial target AND the resulting net
 * margin still meets the minimum (per product, falling back to the global default).
 *
 * Money basis: every margin figure uses revenue EXCLUDING VAT. The payment fee is charged by the
 * provider on what the customer actually pays, so it is computed on the VAT-inclusive total.
 */

export type ShippingClass = "A" | "B" | "C" | "D";
const CLASS_RANK: Record<ShippingClass, number> = { A: 1, B: 2, C: 3, D: 4 };
// A product with no class is priced as the middle class but can never get free shipping.
const FALLBACK_CLASS: ShippingClass = "B";

export interface EngineProduct {
  id: string;
  shippingClass: ShippingClass | null;
  purchaseCost: number | null;
  weightKg: number | null;
  packagingCost: number | null;
  freeShippingEligible: boolean;
  minimumMarginPercent: number | null;
  minimumMarginAmount: number | null;
  specialShippingRequired: boolean;
  shippingOverride: boolean;
  shippingOverrideCost: number | null;
  /** ECT's own carrier cost for this product per zone; null/absent = use the class rate's cost. */
  shippingCostByZone: Partial<Record<RateZone, number | null>>;
}

export interface EngineLine {
  product: EngineProduct;
  quantity: number;
  unitPriceNet: number;
  vatRate: number;
}

export interface EngineSettings {
  defaultMinimumNetMarginPercent: number;
  freeShippingTarget: number;
  paymentFeePercent: number;
  paymentFixedFee: number;
  defaultPackagingCost: number;
  includedWeightKg: number;
  handlingFeePerExtraKg: number;
}

export interface RateEntry {
  mode: "fixed" | "quote";
  customerCharge: number | null;
  ectCost: number | null;
}
export type RateTable = Record<RateZone, Record<ShippingClass, RateEntry>>;

export interface EngineInput {
  lines: EngineLine[];
  country: string | null | undefined;
  /** Order-level discount, net of VAT. Free shipping is evaluated AFTER it. */
  discountNet?: number;
  settings: EngineSettings;
  rates: RateTable;
  /** Admin-approved shipping price (net) for this specific order. */
  adminOverridePrice?: number | null;
}

export type MarginStatus = "SAFE" | "WARNING" | "LOSS" | "UNRELIABLE";

export interface Profitability {
  productRevenueNet: number;
  customerShippingNet: number;
  revenueNet: number;
  vatTotal: number;
  revenueGross: number;
  productCost: number | null;
  ectShippingCost: number;
  shippingSubsidy: number;
  paymentFee: number;
  packagingCost: number;
  grossProfit: number | null;
  grossMarginPercent: number | null;
  netProfit: number | null;
  netMarginPercent: number | null;
  minMarginPercent: number;
  status: MarginStatus;
  lossDrivers: string[];
}

export type EngineFlag = "MISSING_COST_DATA" | "MISSING_SHIPPING_CLASS" | "MISSING_WEIGHT";

export interface EngineResult {
  destination: Destination;
  rateZone: RateZone;
  appliedClass: ShippingClass | null;
  quoteRequired: boolean;
  quoteReasons: string[];
  customerShippingNet: number;
  customerShippingVat: number;
  freeShipping: boolean;
  freeDeniedReason: string | null;
  goodsGross: number;
  goodsNet: number;
  goodsVat: number;
  flags: EngineFlag[];
  dutiesIncluded: false;
  dutiesNotice: boolean;
  overrideActive: boolean;
  /** Null when shipping is by quote: there is no price to compute a margin against. */
  profitability: Profitability | null;
}

export const MARGIN_MESSAGE = "Free shipping would reduce the order below the minimum margin requirement.";

export function round2(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function marginStatus(marginPercent: number, minMarginPercent: number): Exclude<MarginStatus, "UNRELIABLE"> {
  if (marginPercent < 0) return "LOSS";
  // Between zero and the minimum is a warning; the bottom 5 points of that band is the most
  // urgent part, but anything under the minimum needs a look, so it is one status.
  if (marginPercent < minMarginPercent) return "WARNING";
  return "SAFE";
}

// Orders that count towards profitability: cancelled and refunded ones do not.
export const PROFITABLE_ORDER_STATUSES = ["paid", "processing", "shipped", "delivered"] as const;
export function countsTowardsProfitability(status: string): boolean {
  return (PROFITABLE_ORDER_STATUSES as readonly string[]).includes(status);
}

function lossDrivers(p: {
  grossProfit: number;
  netProfit: number;
  shippingSubsidy: number;
  paymentFee: number;
  packagingCost: number;
}): string[] {
  if (p.netProfit >= 0) return [];
  if (p.grossProfit < 0) return ["Product cost is higher than the selling price"];
  const components = [
    { label: "ECT shipping subsidy", amount: Math.max(0, p.shippingSubsidy) },
    { label: "Payment fees", amount: p.paymentFee },
    { label: "Packaging", amount: p.packagingCost },
  ]
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  // The components that on their own turn the order into a loss come first.
  const decisive = components.filter((c) => p.netProfit + c.amount >= 0);
  return (decisive.length > 0 ? decisive : components).map((c) => c.label);
}

/** Profitability of a stored order with the shipping charged to the customer replaced. */
export function profitFromStored(stored: {
  productRevenueNet: number;
  productCost: number | null;
  ectShippingCost: number;
  paymentFee: number;
  packagingCost: number;
  customerShippingNet: number;
  minMarginPercent: number;
}): Pick<Profitability, "customerShippingNet" | "shippingSubsidy" | "netProfit" | "netMarginPercent" | "status" | "lossDrivers"> {
  const { productRevenueNet, productCost, customerShippingNet, ectShippingCost } = stored;
  const shippingSubsidy = round2(ectShippingCost - customerShippingNet);
  if (productCost === null) {
    return { customerShippingNet, shippingSubsidy, netProfit: null, netMarginPercent: null, status: "UNRELIABLE", lossDrivers: [] };
  }
  const revenueNet = productRevenueNet + customerShippingNet;
  const netProfit = round2(revenueNet - productCost - ectShippingCost - stored.paymentFee - stored.packagingCost);
  const netMarginPercent = revenueNet > 0 ? round2((netProfit / revenueNet) * 100) : 0;
  return {
    customerShippingNet,
    shippingSubsidy,
    netProfit,
    netMarginPercent,
    status: marginStatus(netMarginPercent, stored.minMarginPercent),
    lossDrivers: lossDrivers({
      grossProfit: productRevenueNet - productCost,
      netProfit,
      shippingSubsidy,
      paymentFee: stored.paymentFee,
      packagingCost: stored.packagingCost,
    }),
  };
}

export function calculateShipping(input: EngineInput): EngineResult {
  const { lines, settings, rates } = input;
  const destination = destinationOf(input.country);
  const rateZone = rateZoneOf(destination);
  const flags = new Set<EngineFlag>();

  // ---- goods, after the discount ------------------------------------------------------------
  const undiscountedNet = lines.reduce((sum, l) => sum + l.quantity * l.unitPriceNet, 0);
  const discountNet = Math.min(Math.max(input.discountNet ?? 0, 0), undiscountedNet);
  const discountFactor = undiscountedNet > 0 ? (undiscountedNet - discountNet) / undiscountedNet : 1;
  const lineNets = lines.map((l) => l.quantity * l.unitPriceNet * discountFactor);
  const goodsNet = round2(lineNets.reduce((s, n) => s + n, 0));
  const goodsVat = round2(lineNets.reduce((s, n, i) => s + n * (lines[i].vatRate / 100), 0));
  const goodsGross = round2(goodsNet + goodsVat);

  // ---- class, weight, cost ------------------------------------------------------------------
  let appliedClass: ShippingClass | null = null;
  for (const line of lines) {
    let cls = line.product.shippingClass;
    if (cls === null) {
      flags.add("MISSING_SHIPPING_CLASS");
      cls = FALLBACK_CLASS;
    }
    if (appliedClass === null || CLASS_RANK[cls] > CLASS_RANK[appliedClass]) appliedClass = cls;
  }

  const totalWeightKg = lines.reduce((s, l) => s + (l.product.weightKg ?? 0) * l.quantity, 0);
  if (lines.some((l) => l.product.weightKg === null || l.product.weightKg <= 0)) flags.add("MISSING_WEIGHT");

  const missingCost = lines.some((l) => l.product.purchaseCost === null || l.product.purchaseCost <= 0);
  if (missingCost) flags.add("MISSING_COST_DATA");
  const productCost = missingCost
    ? null
    : round2(lines.reduce((s, l) => s + l.quantity * (l.product.purchaseCost as number), 0));

  const packagingCost = round2(
    lines.length === 0
      ? 0
      : Math.max(...lines.map((l) => l.product.packagingCost ?? settings.defaultPackagingCost)),
  );

  // ---- quotation cases ----------------------------------------------------------------------
  const quoteReasons: string[] = [];
  if (lines.some((l) => l.product.specialShippingRequired)) quoteReasons.push("Special shipping required");
  if (appliedClass === "D") quoteReasons.push("Shipping quotation required (class D)");
  const rate = appliedClass ? rates[rateZone][appliedClass] : null;
  if (
    appliedClass &&
    appliedClass !== "D" &&
    (!rate || rate.mode === "quote" || rate.customerCharge === null || rate.ectCost === null)
  ) {
    quoteReasons.push(`Shipping calculated individually (class ${appliedClass}, ${rateZone})`);
  }

  const base = {
    destination,
    rateZone,
    appliedClass,
    goodsGross,
    goodsNet,
    goodsVat,
    flags: [...flags],
    dutiesIncluded: false as const,
    dutiesNotice: dutiesNotIncluded(destination),
  };

  if (quoteReasons.length > 0 || !rate || rate.customerCharge === null || rate.ectCost === null) {
    return {
      ...base,
      quoteRequired: true,
      quoteReasons,
      customerShippingNet: 0,
      customerShippingVat: 0,
      freeShipping: false,
      freeDeniedReason: "Shipping is quoted individually.",
      overrideActive: false,
      profitability: null,
    };
  }

  // ---- what ECT pays, and the tariff the customer would be charged --------------------------
  const highestLineCost = Math.max(...lines.map((l) => l.product.shippingCostByZone[rateZone] ?? rate.ectCost!));
  const handling = round2(Math.max(0, totalWeightKg - settings.includedWeightKg) * settings.handlingFeePerExtraKg);
  const ectShippingCost = round2(highestLineCost + handling);

  const overrideLines = lines.filter((l) => l.product.shippingOverride);
  let paidCharge = round2(rate.customerCharge + handling);
  if (overrideLines.length > 0) {
    paidCharge = round2(Math.max(...overrideLines.map((l) => l.product.shippingOverrideCost ?? rate.customerCharge!)));
  }
  const adminOverride = input.adminOverridePrice ?? null;
  if (adminOverride !== null) paidCharge = round2(Math.max(0, adminOverride));

  const minMarginPercent = Math.max(
    settings.defaultMinimumNetMarginPercent,
    ...lines.map((l) => l.product.minimumMarginPercent ?? 0),
  );
  const minMarginAmount = Math.max(0, ...lines.map((l) => l.product.minimumMarginAmount ?? 0));

  const scenario = (chargeNet: number): Profitability => {
    const revenueNet = round2(goodsNet + chargeNet);
    const vatTotal = round2(goodsVat + chargeNet * (SHIPPING_VAT_RATE / 100));
    const revenueGross = round2(revenueNet + vatTotal);
    const paymentFee = round2((revenueGross * settings.paymentFeePercent) / 100 + settings.paymentFixedFee);
    const shippingSubsidy = round2(ectShippingCost - chargeNet);
    const shared = {
      productRevenueNet: goodsNet,
      customerShippingNet: chargeNet,
      revenueNet,
      vatTotal,
      revenueGross,
      productCost,
      ectShippingCost,
      shippingSubsidy,
      paymentFee,
      packagingCost,
      minMarginPercent,
    };
    if (productCost === null) {
      return { ...shared, grossProfit: null, grossMarginPercent: null, netProfit: null, netMarginPercent: null, status: "UNRELIABLE", lossDrivers: [] };
    }
    const grossProfit = round2(goodsNet - productCost);
    const netProfit = round2(revenueNet - productCost - ectShippingCost - paymentFee - packagingCost);
    const netMarginPercent = revenueNet > 0 ? round2((netProfit / revenueNet) * 100) : 0;
    return {
      ...shared,
      grossProfit,
      grossMarginPercent: goodsNet > 0 ? round2((grossProfit / goodsNet) * 100) : 0,
      netProfit,
      netMarginPercent,
      status: marginStatus(netMarginPercent, minMarginPercent),
      lossDrivers: lossDrivers({ grossProfit, netProfit, shippingSubsidy, paymentFee, packagingCost }),
    };
  };

  // ---- free shipping: only when every condition holds ---------------------------------------
  let freeDeniedReason: string | null = null;
  let freeShipping = false;
  const notEligible =
    overrideLines.length > 0 ||
    adminOverride !== null ||
    lines.some((l) => !l.product.freeShippingEligible) ||
    appliedClass === "C" ||
    flags.has("MISSING_SHIPPING_CLASS");

  if (notEligible) {
    freeDeniedReason = "This order is not eligible for free shipping.";
  } else if (missingCost) {
    freeDeniedReason = "Product cost data is missing, so the margin cannot be verified.";
  } else if (goodsGross < settings.freeShippingTarget) {
    freeDeniedReason = "The order is below the free shipping target.";
  } else {
    const ifFree = scenario(0);
    const marginOk =
      (ifFree.netMarginPercent as number) >= minMarginPercent && (ifFree.netProfit as number) >= minMarginAmount;
    if (marginOk) freeShipping = true;
    else freeDeniedReason = MARGIN_MESSAGE;
  }

  const chargeNet = freeShipping ? 0 : paidCharge;
  return {
    ...base,
    quoteRequired: false,
    quoteReasons: [],
    customerShippingNet: chargeNet,
    customerShippingVat: round2(chargeNet * (SHIPPING_VAT_RATE / 100)),
    freeShipping,
    freeDeniedReason: freeShipping ? null : freeDeniedReason,
    overrideActive: adminOverride !== null,
    profitability: scenario(chargeNet),
  };
}

/**
 * How much more the customer must add for free shipping — only when the amount is the one thing
 * standing in the way. The cart is scaled up proportionally to the target (same mix, same
 * discount rate) and the full engine decides whether that order would really qualify, so the
 * cart never promises free shipping the margin rules would then refuse.
 */
export function amountToUnlockFreeShipping(input: EngineInput): number | null {
  const now = calculateShipping(input);
  if (now.quoteRequired || now.freeShipping || now.goodsGross <= 0) return null;
  const target = input.settings.freeShippingTarget;
  if (now.goodsGross >= target) return null;
  const factor = (target / now.goodsGross) * 1.0005;
  const scaled = calculateShipping({
    ...input,
    lines: input.lines.map((l) => ({ ...l, quantity: l.quantity * factor })),
    discountNet: (input.discountNet ?? 0) * factor,
  });
  return scaled.freeShipping ? round2(target - now.goodsGross) : null;
}
