import type { Database } from "@/types/database";

export type SupplierStatus = Database["public"]["Enums"]["supplier_status"];

// procurement.md §2: a supplier discovered/under review is a lead, not a fact — it cannot be
// awarded a purchase order until a human has qualified it.
const ORDER_ELIGIBLE_STATUSES: SupplierStatus[] = ["qualified", "approved", "preferred"];

export function isEligibleForOrder(status: SupplierStatus): boolean {
  return ORDER_ELIGIBLE_STATUSES.includes(status);
}

// business-rules.md §1: landed_cost = purchase_cost + shipping + handling + duties (+ payment
// costs / other known costs, not modeled yet — see migration 0015). procurement.md §4: only
// compute it once unit price + shipping + at least one of duties/handling are known; otherwise
// leave it null so the UI can render "incomplete" rather than a number that understates cost.
export interface LandedCostInputs {
  unitPrice: number;
  shippingCost: number | null;
  dutiesCost: number | null;
  handlingCost: number | null;
}

export function computeLandedCost(inputs: LandedCostInputs): number | null {
  const hasShipping = inputs.shippingCost !== null;
  const hasDutiesOrHandling = inputs.dutiesCost !== null || inputs.handlingCost !== null;
  if (!hasShipping || !hasDutiesOrHandling) return null;

  return (
    inputs.unitPrice +
    (inputs.shippingCost ?? 0) +
    (inputs.dutiesCost ?? 0) +
    (inputs.handlingCost ?? 0)
  );
}

// business-rules.md §6.
export interface ScoringWeights {
  price: number;
  leadTime: number;
  quality: number;
  reliability: number;
  moq: number;
  shipping: number;
  paymentTerms: number;
}

export interface QuoteForScoring {
  id: string;
  unitPrice: number;
  leadTimeDays: number | null;
  moq: number | null;
  shippingCost: number | null;
  paymentTerms: string | null;
  supplierStatus: SupplierStatus;
  supplierQualityScore: number | null;
  supplierReliabilityScore: number | null;
}

export type QuoteLabel = "BEST_PRICE" | "FASTEST" | "BEST_VALUE" | "PREFERRED_SUPPLIER";

export interface ScoredQuote extends QuoteForScoring {
  score: number;
  labels: QuoteLabel[];
}

// Lower-is-better factors (price, lead time, shipping) have no absolute scale, so they are
// normalized 0-100 relative to the other quotes on the same RFQ, per business-rules.md §6 ("each
// factor normalized 0-100 before weighting"). A missing value is scored as worst (0), matching how
// `confidence`/`source` are already treated elsewhere in this codebase: unknown is never assumed
// favorable.
function normalizeLowerIsBetter(values: (number | null)[]): number[] {
  const known = values.filter((v): v is number => v !== null);
  if (known.length === 0) return values.map(() => 0);

  const min = Math.min(...known);
  const max = Math.max(...known);
  if (min === max) return values.map((v) => (v === null ? 0 : 100));

  return values.map((v) => (v === null ? 0 : (100 * (max - v)) / (max - min)));
}

// MOQ "fit" is scored against the actual requested quantity, not relative to other quotes: a
// quote with no MOQ is a perfect fit regardless of what other suppliers require, and a MOQ at or
// below the requested quantity is equally a perfect fit.
function moqFitScore(moq: number | null, requestedQuantity: number): number {
  if (moq === null || moq <= requestedQuantity) return 100;
  return Math.max(0, (100 * requestedQuantity) / moq);
}

// Payment terms are free text (e.g. "Net 30", "50% deposit") with no MVP parsing to rank
// favorability — scored only on whether the supplier disclosed terms at all, since fabricating a
// favorability judgment from unstructured text would violate the "never fabricate certainty" rule
// applied to AI-sourced fields elsewhere (procurement.md §3).
function paymentTermsScore(paymentTerms: string | null): number {
  return paymentTerms && paymentTerms.trim().length > 0 ? 100 : 0;
}

export function rankQuotes(
  quotes: QuoteForScoring[],
  weights: ScoringWeights,
  requestedQuantity: number,
): ScoredQuote[] {
  if (quotes.length === 0) return [];

  const priceScores = normalizeLowerIsBetter(quotes.map((q) => q.unitPrice));
  const leadTimeScores = normalizeLowerIsBetter(quotes.map((q) => q.leadTimeDays));
  const shippingScores = normalizeLowerIsBetter(quotes.map((q) => q.shippingCost));

  const scored: ScoredQuote[] = quotes.map((quote, i) => {
    const qualityScore = quote.supplierQualityScore ?? 0;
    const reliabilityScore = quote.supplierReliabilityScore ?? 0;
    const moqScore = moqFitScore(quote.moq, requestedQuantity);
    const termsScore = paymentTermsScore(quote.paymentTerms);

    const score =
      priceScores[i] * weights.price +
      leadTimeScores[i] * weights.leadTime +
      qualityScore * weights.quality +
      reliabilityScore * weights.reliability +
      moqScore * weights.moq +
      shippingScores[i] * weights.shipping +
      termsScore * weights.paymentTerms;

    return { ...quote, score: Math.round(score * 100) / 100, labels: [] };
  });

  const lowestPrice = Math.min(...scored.map((q) => q.unitPrice));
  const knownLeadTimes = scored.map((q) => q.leadTimeDays).filter((v): v is number => v !== null);
  const fastestLeadTime = knownLeadTimes.length > 0 ? Math.min(...knownLeadTimes) : null;
  const highestScore = Math.max(...scored.map((q) => q.score));

  for (const quote of scored) {
    if (quote.unitPrice === lowestPrice) quote.labels.push("BEST_PRICE");
    if (fastestLeadTime !== null && quote.leadTimeDays === fastestLeadTime) quote.labels.push("FASTEST");
    if (quote.score === highestScore) quote.labels.push("BEST_VALUE");
    if (quote.supplierStatus === "preferred") quote.labels.push("PREFERRED_SUPPLIER");
  }

  return scored.sort((a, b) => b.score - a.score);
}

export const QUOTE_LABEL_TEXT: Record<QuoteLabel, string> = {
  BEST_PRICE: "Best price",
  FASTEST: "Fastest",
  BEST_VALUE: "Best value",
  PREFERRED_SUPPLIER: "Preferred supplier",
};
