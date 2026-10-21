import type { OrderStatus } from "@/lib/api/types";

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function orderStatusVariant(status: OrderStatus): "positive" | "warning" | "destructive" {
  switch (status) {
    case "paid":
      return "positive";
    case "pending":
      return "warning";
    case "failed":
      return "destructive";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function checkoutResultTitle(status: OrderStatus): string {
  switch (status) {
    case "paid":
      return "Payment received";
    case "pending":
      return "Payment pending";
    case "failed":
      return "Payment failed";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}
