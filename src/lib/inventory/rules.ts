export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

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

export type DeliveryEstimate = "ships_immediately" | "ships_2_3_days" | "made_to_order";

export const DELIVERY_ESTIMATE_LABEL: Record<DeliveryEstimate, string> = {
  ships_immediately: "Ships immediately",
  ships_2_3_days: "Ships in 2–3 days",
  made_to_order: "Made to order (1–2 weeks)",
};

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
  if (deliveryEstimate) return DELIVERY_ESTIMATE_LABEL[deliveryEstimate];
  if (status === "out_of_stock" && restockMode) return restockLabel;
  return STOCK_STATUS_LABEL[status];
}
