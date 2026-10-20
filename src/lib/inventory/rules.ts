export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

const VALID_STOCK_STATUSES: StockStatus[] = ["in_stock", "low_stock", "out_of_stock"];

// availability_status is an untyped PostgREST computed-field column (typed as `string | null`
// wherever it's selected) — narrow it defensively so a bad/unknown value fails safe as "out of
// stock" rather than crashing or silently rendering as purchasable.
export function parseAvailabilityStatus(status: string | null | undefined): StockStatus {
  return VALID_STOCK_STATUSES.includes(status as StockStatus) ? (status as StockStatus) : "out_of_stock";
}

export interface StockLevel {
  current_stock: number;
  reserved_stock: number;
  reorder_point: number;
}

// business-rules.md §2: available_stock = current_stock - reserved_stock.
export function getAvailableStock(inventory: StockLevel | null): number {
  if (!inventory) return 0;
  return Math.max(0, inventory.current_stock - inventory.reserved_stock);
}

export function getStockStatus(inventory: StockLevel | null): StockStatus {
  const available = getAvailableStock(inventory);
  if (available <= 0) return "out_of_stock";
  if (inventory && available <= inventory.reorder_point) return "low_stock";
  return "in_stock";
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
};

export type DeliveryEstimate = "ships_immediately" | "ships_2_3_days" | "made_to_order" | "available_3_working_days";

export const DELIVERY_ESTIMATE_LABEL: Record<DeliveryEstimate, string> = {
  ships_immediately: "Ships immediately",
  ships_2_3_days: "Ships in 2–3 days",
  made_to_order: "Made to order (1–2 weeks)",
  available_3_working_days: "Available in 3 working days",
};

/**
 * Products ECT does not hold but can supply within three working days: they stay orderable at
 * zero stock (the sale simply takes the stock negative, which is the signal to buy it in).
 * Every other delivery estimate is only a label and never makes an out-of-stock item purchasable.
 */
export function isBackorderable(deliveryEstimate: string | null | undefined): boolean {
  return deliveryEstimate === "available_3_working_days";
}

/** Date `days` working days (Mon-Fri) after `from`; public holidays are not modelled. */
export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return d;
}

// What a customer sees for timing, in priority order: a manually-set delivery estimate is the
// most deliberate signal an admin can give and wins outright; failing that, restock mode (a
// site-wide "don't show a bare zero" toggle) covers a real out-of-stock item; otherwise it's
// just the computed stock status. None of this affects whether the item is actually purchasable
// — that still gates on the real stock numbers (see PurchasePanel), only the label changes.
export function getAvailabilityLabel(
  status: StockStatus,
  deliveryEstimate: DeliveryEstimate | null,
  restockMode: boolean,
  restockLabel: string,
): string {
  // Once such a product is back in stock it is simply "In stock", not "Available in 3 working days".
  if (isBackorderable(deliveryEstimate) && status !== "out_of_stock") return STOCK_STATUS_LABEL[status];
  if (deliveryEstimate) return DELIVERY_ESTIMATE_LABEL[deliveryEstimate];
  if (status === "out_of_stock" && restockMode) return restockLabel;
  return STOCK_STATUS_LABEL[status];
}
