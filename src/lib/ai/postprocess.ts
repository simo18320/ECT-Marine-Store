/**
 * ai-engine.md §3's code-enforced backstop: "responses are checked for product/SKU mentions not
 * present in the supplied context before being shown". The system prompt already tells Claude not
 * to invent a SKU, but this check doesn't trust that — it's a plain string match against the SKUs
 * actually retrieved for this turn, checked here rather than relying on model behavior.
 *
 * ECT SKUs all share the same shape (database.md's seed data: ECT-CTO-10-10M, ECT-UV-40GPM, ...),
 * which makes a regex-based scan of the free-text reply actually workable — this is deliberately
 * a "basic allowlist check" (the doc's own words) on SKU mentions, not a general fact-checker.
 */
const SKU_PATTERN = /\bECT-[A-Z0-9-]+\b/g;

export interface RecommendedProduct {
  sku: string;
  name: string;
  reason: string;
}

export interface AssistantResponsePayload {
  reply: string;
  known: { fact: string; source: string }[];
  recommendation: { products: RecommendedProduct[]; ruleSource: string } | null;
  needsVerification: string[];
}

export interface PostprocessResult {
  allowed: boolean;
  violations: string[];
}

export function extractMentionedSkus(payload: AssistantResponsePayload): string[] {
  const mentioned = new Set<string>();
  for (const match of payload.reply.matchAll(SKU_PATTERN)) mentioned.add(match[0]);
  for (const product of payload.recommendation?.products ?? []) mentioned.add(product.sku);
  return [...mentioned];
}

export function checkAllowlist(payload: AssistantResponsePayload, allowedSkus: ReadonlySet<string>): PostprocessResult {
  const violations = extractMentionedSkus(payload).filter((sku) => !allowedSkus.has(sku));
  return { allowed: violations.length === 0, violations };
}

// ai-engine.md §3's required fallback when data is missing, used verbatim so it's recognizable
// in ai_messages/support review rather than a slightly-different paraphrase each time.
export const FALLBACK_MESSAGE =
  "I don't have enough verified information to confirm this. I can only share details ECT has actually recorded — tell me the product or yacht you mean and I'll check what's on file.";
