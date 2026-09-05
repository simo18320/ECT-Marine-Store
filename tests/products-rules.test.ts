import { describe, expect, it } from "vitest";
import { toListItem, type RawProductListRow } from "@/lib/products/queries";

function rawRow(overrides: Partial<RawProductListRow> = {}): RawProductListRow {
  return {
    id: "p1",
    sku: "ECT-TEST-1",
    name: "Test Product",
    slug: "test-product",
    category_id: null,
    brand_id: null,
    description: null,
    short_description: null,
    technical_specs: {},
    unit: "pcs",
    purchase_cost: null,
    selling_price: 10,
    vat_rate: 22,
    is_bundle: false,
    is_active: true,
    certifications: [],
    search_vector: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    availability_status: "in_stock",
    primary_image: null,
    ...overrides,
  } as RawProductListRow;
}

describe("toListItem", () => {
  it("passes through a valid availability_status unchanged", () => {
    expect(toListItem(rawRow({ availability_status: "low_stock" })).availability_status).toBe("low_stock");
  });

  it("falls back to out_of_stock for a null availability_status (defensive, never crashes or shows purchasable)", () => {
    expect(toListItem(rawRow({ availability_status: null })).availability_status).toBe("out_of_stock");
  });

  it("falls back to out_of_stock for an unrecognized status value from a stale computed field", () => {
    expect(toListItem(rawRow({ availability_status: "backordered" })).availability_status).toBe("out_of_stock");
  });

  it("preserves every other product field unchanged", () => {
    const item = toListItem(rawRow({ sku: "ECT-KEEP-ME", selling_price: 42 }));
    expect(item.sku).toBe("ECT-KEEP-ME");
    expect(item.selling_price).toBe(42);
  });
});
