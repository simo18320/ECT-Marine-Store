import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Consumer-facing prices must include VAT; catalogue prices are stored net.
export function withVat(netAmount: number, vatRate: number) {
  return Math.round(netAmount * (1 + vatRate / 100) * 100) / 100;
}

export function formatCurrency(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);
}
