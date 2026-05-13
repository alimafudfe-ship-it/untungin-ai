import type { Expense, Goal, Product } from "@/types/dashboard";

export const FREE_PRODUCT_LIMIT = 3;
export const MONTHLY_PRICE = "Rp29.000/bulan";
export const LIFETIME_PRICE = "Rp99.000 sekali bayar";
export const MIDTRANS_REVIEW_MODE = false;

export const EXPENSE_CATEGORIES = [
  "Ads",
  "Packing",
  "Admin Marketplace",
  "Fee Transfer",
  "Karyawan",
  "Tools",
  "Operasional",
  "Internet",
  "Listrik",
  "Retur",
  "Lainnya",
] as const;

export const DEMO_PRODUCTS: Product[] = [
  { id: "demo-1", name: "Kopi Susu 250ml", costPrice: 10800, sellingPrice: 20000, quantitySold: 250, stockInitial: 1000, stockRemaining: 750, otherCost: 0, profit: 2300000, margin: 46, marketplace: "Shopee" },
  { id: "demo-2", name: "Jahe Instan", costPrice: 1012, sellingPrice: 2000, quantitySold: 100, stockInitial: 2000, stockRemaining: 1900, otherCost: 20, profit: 98780, margin: 49.4, marketplace: "Tokopedia" },
];

export const DEMO_EXPENSES: Expense[] = [
  { id: "exp-1", label: "Iklan marketplace", category: "Ads", amount: 320000, date: new Date().toISOString().slice(0, 10) },
  { id: "exp-2", label: "Packing", category: "Packing", amount: 85000, date: new Date().toISOString().slice(0, 10) },
];

export const DEMO_GOALS: Goal[] = [
  { id: "goal-1", label: "Target profit bulanan", target: 5000000, current: 2398780, period: "Bulan ini" },
  { id: "goal-2", label: "Target omzet bulanan", target: 12000000, current: 5200000, period: "Bulan ini" },
];
