import { describe, expect, it } from "vitest";
import { normaliseSize, rankProducts, toOrQuery, type SearchCriteria } from "@/lib/ai/ranking";
import type { ProductListItem } from "@/lib/products/queries";

const product = (name: string, specs: Record<string, unknown>, over: Partial<ProductListItem> = {}) =>
  ({ id: name, sku: name, name, short_description: null, technical_specs: specs, availability_status: "in_stock", ...over }) as unknown as ProductListItem;

const criteria: SearchCriteria = { keywords: ["sediment", "cartridge"], size: '10"', micron: 5 };

describe("rankProducts", () => {
  const exact = product("Sediment cartridge 10 5 micron", { size: '10"', micron_rating: 5 });
  const wrongMicron = product("Sediment cartridge 10 20 micron", { size: '10"', micron_rating: 20 });
  const wrongSize = product("Sediment cartridge big", { size: '4.5" x 10" (Big Blue)', micron_rating: 5 });
  const carbon = product("Carbon block", { size: '10"', micron_rating: 5 });

  it("puts the exact size+micron match first", () => {
    expect(rankProducts([wrongMicron, wrongSize, exact], criteria)[0]).toBe(exact);
  });

  it("does not treat a 4.5 x 10 housing size as a 10 inch match", () => {
    const ranked = rankProducts([wrongSize, exact], criteria);
    expect(ranked.indexOf(exact)).toBeLessThan(ranked.indexOf(wrongSize));
  });

  it("drops products that match neither keywords nor specs", () => {
    expect(rankProducts([carbon], { keywords: ["uv lamp"], size: null, micron: null })).toEqual([]);
  });

  it("ranks an out-of-stock product below an identical in-stock one", () => {
    const oos = product("Sediment cartridge b", { size: '10"', micron_rating: 5 }, { availability_status: "out_of_stock" });
    expect(rankProducts([oos, exact], criteria)[0]).toBe(exact);
  });
});

describe("query helpers", () => {
  it("normalises sizes", () => {
    expect(normaliseSize("10")).toBe('10"');
    expect(normaliseSize("10 inch")).toBe('10"');
    expect(normaliseSize("20in")).toBe('20"');
    expect(normaliseSize(null)).toBeNull();
  });

  it("builds an OR websearch query and quotes phrases", () => {
    expect(toOrQuery({ keywords: ["sediment", "uv lamp"], size: null, micron: null })).toBe('sediment or "uv lamp"');
  });
});
