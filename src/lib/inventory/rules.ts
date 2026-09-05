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
