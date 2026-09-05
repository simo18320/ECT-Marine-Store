import { describe, expect, it } from "vitest";
import { addItem, computeCartTotals, removeItem, updateQuantity, type CartItem } from "@/lib/cart/rules";

function item(overrides: Partial<CartItem> = {}): Omit<CartItem, "quantity"> {
  return {
    productId: "p1",
    sku: "ECT-TEST-1",
    name: "Test Product",
    slug: "test-product",
    unitPrice: 10,
    vatRate: 22,
    ...overrides,
  };
}

describe("addItem", () => {
  it("adds a new line for a product not already in the cart", () => {
    const result = addItem([], item(), 2);
    expect(result).toEqual([{ ...item(), quantity: 2 }]);
  });

  it("increments quantity rather than duplicating a line for an existing product", () => {
    const cart = addItem([], item(), 1);
    const result = addItem(cart, item(), 3);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(4);
  });

  it("defaults to a quantity of 1 when none is given", () => {
    expect(addItem([], item())[0].quantity).toBe(1);
  });

  it("does not mutate the input array", () => {
    const cart: CartItem[] = [{ ...item(), quantity: 1 }];
    const before = [...cart];
    addItem(cart, item({ productId: "p2" }), 1);
    expect(cart).toEqual(before);
  });
});

describe("removeItem", () => {
  it("removes only the matching line", () => {
    const cart = [{ ...item(), quantity: 1 }, { ...item({ productId: "p2" }), quantity: 1 }];
    const result = removeItem(cart, "p1");
    expect(result.map((i) => i.productId)).toEqual(["p2"]);
  });

  it("is a no-op for a productId not in the cart", () => {
    const cart = [{ ...item(), quantity: 1 }];
    expect(removeItem(cart, "does-not-exist")).toEqual(cart);
  });
});

describe("updateQuantity", () => {
  it("updates the quantity of the matching line", () => {
    const cart = [{ ...item(), quantity: 1 }];
    expect(updateQuantity(cart, "p1", 5)[0].quantity).toBe(5);
  });

  it("removes the line entirely when the new quantity is zero", () => {
    const cart = [{ ...item(), quantity: 1 }];
    expect(updateQuantity(cart, "p1", 0)).toEqual([]);
  });

  it("removes the line entirely for a negative quantity", () => {
    const cart = [{ ...item(), quantity: 1 }];
    expect(updateQuantity(cart, "p1", -1)).toEqual([]);
  });
});

describe("computeCartTotals", () => {
  it("returns all zeros for an empty cart", () => {
    expect(computeCartTotals([])).toEqual({ subtotal: 0, vatTotal: 0, grandTotal: 0, itemCount: 0 });
  });

  it("sums subtotal, VAT (per line's own rate), and item count across lines", () => {
    const cart: CartItem[] = [
      { ...item({ unitPrice: 100, vatRate: 22 }), quantity: 2 },
      { ...item({ productId: "p2", unitPrice: 50, vatRate: 10 }), quantity: 1 },
    ];
    const totals = computeCartTotals(cart);
    expect(totals.subtotal).toBe(250);
    expect(totals.vatTotal).toBeCloseTo(49, 5);
    expect(totals.grandTotal).toBeCloseTo(299, 5);
    expect(totals.itemCount).toBe(3);
  });
});
