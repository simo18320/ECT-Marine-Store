import { describe, expect, it } from "vitest";
import { getAvailableStock, getStockStatus, STOCK_STATUS_LABEL } from "@/lib/inventory/rules";

describe("getAvailableStock", () => {
  it("subtracts reserved from current stock", () => {
    expect(getAvailableStock({ current_stock: 10, reserved_stock: 3, reorder_point: 2 })).toBe(7);
  });

  it("never goes negative when reserved exceeds current (over-reservation edge case)", () => {
    expect(getAvailableStock({ current_stock: 2, reserved_stock: 5, reorder_point: 0 })).toBe(0);
  });

  it("returns 0 for a product with no inventory row at all", () => {
    expect(getAvailableStock(null)).toBe(0);
  });
});

describe("getStockStatus", () => {
  it("is out_of_stock when available is zero", () => {
    expect(getStockStatus({ current_stock: 3, reserved_stock: 3, reorder_point: 5 })).toBe("out_of_stock");
  });

  it("is out_of_stock when there's no inventory row", () => {
    expect(getStockStatus(null)).toBe("out_of_stock");
  });

  it("is low_stock when available is above zero but at or below the reorder point", () => {
    expect(getStockStatus({ current_stock: 10, reserved_stock: 5, reorder_point: 5 })).toBe("low_stock");
  });

  it("is in_stock when available is above the reorder point", () => {
    expect(getStockStatus({ current_stock: 20, reserved_stock: 5, reorder_point: 5 })).toBe("in_stock");
  });

  it("treats available exactly one above reorder_point as in_stock, not low_stock", () => {
    expect(getStockStatus({ current_stock: 16, reserved_stock: 5, reorder_point: 10 })).toBe("in_stock");
  });
});

describe("STOCK_STATUS_LABEL", () => {
  it("has a label for every StockStatus value", () => {
    expect(Object.keys(STOCK_STATUS_LABEL).sort()).toEqual(["in_stock", "low_stock", "out_of_stock"]);
  });
});
