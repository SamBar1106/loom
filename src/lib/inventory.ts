import type { InventoryStatus } from "@/lib/api/types";

/** Available units at or below this count are low stock. Documented in the API contract. */
export const LOW_STOCK_AT = 10;

export function inventoryStatus(available: number): InventoryStatus {
  if (available <= 0) return "out_of_stock";
  if (available <= LOW_STOCK_AT) return "low_stock";
  return "in_stock";
}

export function inventoryLabel(status: InventoryStatus, available: number): string {
  switch (status) {
    case "in_stock":
      return `${available} in stock`;
    case "low_stock":
      return `Low · ${available}`;
    case "out_of_stock":
      return "Out of stock";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
