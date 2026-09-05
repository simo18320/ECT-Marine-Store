export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  slug: string;
  unitPrice: number;
  vatRate: number;
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
  itemCount: number;
}

// Pure cart-array transformations, extracted out of the localStorage-backed store
// (lib/cart/cart-context.tsx) so they're testable without a DOM/React environment —
// same "UI -> pure rules.ts" split used for every other domain in this app.
export function addItem(items: CartItem[], item: Omit<CartItem, "quantity">, quantity = 1): CartItem[] {
  const existing = items.find((i) => i.productId === item.productId);
  if (!existing) return [...items, { ...item, quantity }];
  return items.map((i) => (i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i));
}

export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((i) => i.productId !== productId);
}

// A quantity of zero or less removes the line entirely rather than leaving a dead 0-quantity row.
export function updateQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeItem(items, productId);
  return items.map((i) => (i.productId === productId ? { ...i, quantity } : i));
}

export function computeCartTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const vatTotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity * (i.vatRate / 100), 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return { subtotal, vatTotal, grandTotal: subtotal + vatTotal, itemCount };
}
