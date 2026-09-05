import { describe, expect, it } from "vitest";
import { detectProblem } from "@/lib/recommendations/problems";

describe("detectProblem", () => {
  it("matches a message mentioning sediment", () => {
    expect(detectProblem("My water has a lot of sediment in it")?.id).toBe("sediment");
  });

  it("matches regardless of case", () => {
    expect(detectProblem("Worried about LEGIONELLA risk on board")?.id).toBe("microbiological_risk");
  });

  it("matches a filter-replacement question", () => {
    expect(detectProblem("When should I replace my filter?")?.id).toBe("filter_replacement");
  });

  it("returns undefined for a message with no matching keyword", () => {
    expect(detectProblem("What are your opening hours?")).toBeUndefined();
  });

  it("returns undefined for an empty message", () => {
    expect(detectProblem("")).toBeUndefined();
  });
});
