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

describe("backorderable availability", () => {
  it("only the 3-working-day estimate makes an out-of-stock product orderable", async () => {
    const { isBackorderable } = await import("@/lib/inventory/rules");
    expect(isBackorderable("available_3_working_days")).toBe(true);
    for (const other of ["ships_immediately", "ships_2_3_days", "made_to_order", null, undefined]) {
      expect(isBackorderable(other)).toBe(false);
    }
  });

  it("skips weekends when counting working days", async () => {
    const { addWorkingDays } = await import("@/lib/inventory/rules");
    expect(addWorkingDays(new Date("2026-10-21T10:00:00Z"), 3).toISOString().slice(0, 10)).toBe("2026-10-26");
    expect(addWorkingDays(new Date("2026-10-23T10:00:00Z"), 3).toISOString().slice(0, 10)).toBe("2026-10-28");
  });

  it("labels the product by its real state", async () => {
    const { getAvailabilityLabel } = await import("@/lib/inventory/rules");
    expect(getAvailabilityLabel("out_of_stock", "available_3_working_days", true, "Restocking")).toBe("Available in 3 working days");
    expect(getAvailabilityLabel("in_stock", "available_3_working_days", false, "")).toBe("In stock");
  });
});

describe("manual stock movements", () => {
  it("stores a sale and damage as positive quantities, which the trigger subtracts", async () => {
    const { resolveMovement } = await import("@/lib/inventory/movements");
    expect(resolveMovement("manual_sale", 3)).toMatchObject({ movementType: "sale", storedQuantity: 3, delta: -3 });
    expect(resolveMovement("damage", 2)).toMatchObject({ movementType: "damage", storedQuantity: 2, delta: -2, noteRequired: true });
  });

  it("stores a stock correction signed, so a decrease is negative", async () => {
    const { resolveMovement } = await import("@/lib/inventory/movements");
    expect(resolveMovement("correction_decrease", 4)).toMatchObject({ movementType: "adjustment", storedQuantity: -4, delta: -4, noteRequired: true });
    expect(resolveMovement("correction_increase", 4)).toMatchObject({ movementType: "adjustment", storedQuantity: 4, delta: 4 });
  });

  it("goods received and returns add stock", async () => {
    const { resolveMovement } = await import("@/lib/inventory/movements");
    expect(resolveMovement("purchase", 10).delta).toBe(10);
    expect(resolveMovement("return", 1).delta).toBe(1);
  });

  it("displays the effect of a stored movement", async () => {
    const { storedMovementDelta, isMovementKind } = await import("@/lib/inventory/movements");
    expect(storedMovementDelta("sale", 2)).toBe(-2);
    expect(storedMovementDelta("damage", 5)).toBe(-5);
    expect(storedMovementDelta("adjustment", -3)).toBe(-3);
    expect(storedMovementDelta("purchase", 7)).toBe(7);
    expect(isMovementKind("manual_sale")).toBe(true);
    expect(isMovementKind("sale")).toBe(false);
  });
});

describe("refusing to remove more than is in stock", () => {
  it("refuses a removal larger than the stock, unless the product can be backordered", async () => {
    const { removalError } = await import("@/lib/inventory/movements");
    expect(removalError(5, -6, false)).toBe("Only 5 in stock: you cannot remove 6.");
    expect(removalError(0, -1, false)).toBe("Only 0 in stock: you cannot remove 1.");
    expect(removalError(-3, -1, false)).toBe("Only 0 in stock: you cannot remove 1.");
    expect(removalError(5, -6, true)).toBeNull();
  });

  it("allows removing exactly what is there, and never blocks an addition", async () => {
    const { removalError } = await import("@/lib/inventory/movements");
    expect(removalError(5, -5, false)).toBeNull();
    expect(removalError(0, 10, false)).toBeNull();
  });
});
