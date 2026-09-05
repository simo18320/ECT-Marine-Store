export interface OrderLineInput {
  unitPrice: number;
  vatRate: number;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
}

// business-rules.md §1: VAT is per-product, computed from real rates — never a flat guess.
export function computeOrderTotals(lines: OrderLineInput[]): OrderTotals {
  const subtotal = round2(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
  const vatTotal = round2(
    lines.reduce((sum, l) => sum + l.unitPrice * l.quantity * (l.vatRate / 100), 0),
  );
  return { subtotal, vatTotal, grandTotal: round2(subtotal + vatTotal) };
}

function round2(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// Human-readable, collision-resistant order number: ECT-<base36 timestamp>-<4 random chars>.
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ECT-${timestamp}-${random}`;
}

// Stripe wants integer minor units (cents), VAT-inclusive per line since we use one Stripe
// line item per product rather than separate tax line items in the MVP.
export function toStripeUnitAmount(unitPrice: number, vatRate: number): number {
  return Math.round(unitPrice * (1 + vatRate / 100) * 100);
}
