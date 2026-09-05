import { describe, expect, it } from "vitest";
import { checkAllowlist, extractMentionedSkus, type AssistantResponsePayload } from "@/lib/ai/postprocess";

function payload(overrides: Partial<AssistantResponsePayload> = {}): AssistantResponsePayload {
  return {
    reply: "Here's what I found.",
    known: [],
    recommendation: null,
    needsVerification: [],
    ...overrides,
  };
}

describe("extractMentionedSkus", () => {
  it("finds SKU-shaped tokens in the reply text", () => {
    const p = payload({ reply: "The ECT-SED-10-5M cartridge fits that housing." });
    expect(extractMentionedSkus(p)).toEqual(["ECT-SED-10-5M"]);
  });

  it("includes SKUs from the recommendation block", () => {
    const p = payload({
      reply: "I'd suggest one of these.",
      recommendation: { products: [{ sku: "ECT-UV-40GPM", name: "UV System", reason: "matches" }], ruleSource: "recommendation_engine" },
    });
    expect(extractMentionedSkus(p)).toContain("ECT-UV-40GPM");
  });

  it("de-duplicates a SKU mentioned in both reply and recommendation", () => {
    const p = payload({
      reply: "ECT-UV-40GPM is a good fit.",
      recommendation: { products: [{ sku: "ECT-UV-40GPM", name: "UV System", reason: "matches" }], ruleSource: "recommendation_engine" },
    });
    expect(extractMentionedSkus(p)).toEqual(["ECT-UV-40GPM"]);
  });

  it("finds nothing in a reply with no SKU-shaped text", () => {
    const p = payload({ reply: "I don't have enough verified information to confirm this." });
    expect(extractMentionedSkus(p)).toEqual([]);
  });
});

describe("checkAllowlist", () => {
  it("allows a response whose SKUs are all in the retrieved context", () => {
    const p = payload({ reply: "The ECT-SED-10-5M cartridge fits that housing." });
    const result = checkAllowlist(p, new Set(["ECT-SED-10-5M"]));
    expect(result).toEqual({ allowed: true, violations: [] });
  });

  it("rejects a response mentioning a SKU never given as context (hallucinated product)", () => {
    const p = payload({ reply: "Try the ECT-TURBO-9000, it should work great." });
    const result = checkAllowlist(p, new Set(["ECT-SED-10-5M"]));
    expect(result).toEqual({ allowed: false, violations: ["ECT-TURBO-9000"] });
  });

  it("rejects a recommendation naming a product outside the retrieved set", () => {
    const p = payload({
      reply: "Here's a suggestion.",
      recommendation: { products: [{ sku: "ECT-FAKE-1", name: "Fake Product", reason: "invented" }], ruleSource: "recommendation_engine" },
    });
    const result = checkAllowlist(p, new Set(["ECT-SED-10-5M"]));
    expect(result.allowed).toBe(false);
    expect(result.violations).toContain("ECT-FAKE-1");
  });

  it("allows a response with no SKU mentions at all", () => {
    const p = payload({ reply: "I don't have enough verified information to confirm this." });
    expect(checkAllowlist(p, new Set())).toEqual({ allowed: true, violations: [] });
  });

  // Caught live during Phase 8 verification: Claude correctly refused to confirm a fictional
  // product the customer asked about by name, but repeating that name back to say "I don't have
  // information on this" was originally flagged as a violation — rejecting a correct refusal for
  // the wrong reason.
  it("allows the reply to repeat back a SKU the customer's own message already contained", () => {
    const p = payload({ reply: "I don't have any information on ECT-TURBO-9000 in our catalogue." });
    const result = checkAllowlist(p, new Set(["ECT-SED-10-5M"]), "Is the ECT-TURBO-9000 compatible with my UV system?");
    expect(result).toEqual({ allowed: true, violations: [] });
  });

  it("still rejects a recommendation naming a product the customer mentioned, even if the customer named it first", () => {
    const p = payload({
      reply: "Here's a suggestion.",
      recommendation: { products: [{ sku: "ECT-TURBO-9000", name: "Turbo 9000", reason: "you asked about it" }], ruleSource: "recommendation_engine" },
    });
    const result = checkAllowlist(p, new Set(["ECT-SED-10-5M"]), "Is the ECT-TURBO-9000 compatible with my UV system?");
    expect(result.allowed).toBe(false);
    expect(result.violations).toContain("ECT-TURBO-9000");
  });

  it("still rejects a genuinely new hallucinated SKU the customer never mentioned", () => {
    const p = payload({ reply: "Try the ECT-TURBO-9000 instead." });
    const result = checkAllowlist(p, new Set(["ECT-SED-10-5M"]), "What water filters do you sell?");
    expect(result).toEqual({ allowed: false, violations: ["ECT-TURBO-9000"] });
  });
});
