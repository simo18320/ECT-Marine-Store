import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

// Placeholder confirming the test harness (Vitest + `@/` alias) is wired correctly.
// Real domain tests (rules.ts functions per architecture.md §4) start in Phase 2+.
describe("test harness", () => {
  it("resolves the @/ alias and runs", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
