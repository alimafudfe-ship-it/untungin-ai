import type { Expense, Goal, Product } from "@/types/dashboard";

export const FREE_PRODUCT_LIMIT = 5;
export const MONTHLY_PRICE = "Rp49.000/bulan";
export const LIFETIME_PRICE = "Rp299.000 sekali bayar";
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
  { id: "demo-1", name: "Serum Niacinamide 20ml", costPrice: 26500, sellingPrice: 59000, quantitySold: 184, stockInitial: 260, stockRemaining: 76, otherCost: 842000, profit: 5138000, margin: 55.1, marketplace: "Shopee" },
  { id: "demo-2", name: "Paket Hampers Kopi Lokal", costPrice: 52000, sellingPrice: 99000, quantitySold: 73, stockInitial: 110, stockRemaining: 37, otherCost: 386000, profit: 3045000, margin: 47.5, marketplace: "Tokopedia" },
  { id: "demo-3", name: "Outer Linen Wanita", costPrice: 78000, sellingPrice: 139000, quantitySold: 52, stockInitial: 80, stockRemaining: 28, otherCost: 418000, profit: 2754000, margin: 43.9, marketplace: "TikTok Shop" },
  { id: "demo-4", name: "Botol Minum Anak 500ml", costPrice: 31000, sellingPrice: 45000, quantitySold: 96, stockInitial: 120, stockRemaining: 24, otherCost: 529000, profit: 815000, margin: 31.1, marketplace: "Shopee" },
];

export const DEMO_EXPENSES: Expense[] = [
  { id: "exp-1", label: "Iklan Shopee Ads 5.5", category: "Ads", amount: 1250000, date: new Date().toISOString().slice(0, 10) },
  { id: "exp-2", label: "Packing bubble wrap & kardus", category: "Packing", amount: 420000, date: new Date().toISOString().slice(0, 10) },
  { id: "exp-3", label: "Voucher toko ditanggung seller", category: "Admin Marketplace", amount: 680000, date: new Date().toISOString().slice(0, 10) },
  { id: "exp-4", label: "Admin freelance live shopping", category: "Karyawan", amount: 550000, date: new Date().toISOString().slice(0, 10) },
];

export const DEMO_GOALS: Goal[] = [
  { id: "goal-1", label: "Target profit bulanan", target: 18000000, current: 11752000, period: "Bulan ini" },
  { id: "goal-2", label: "Target omzet bulanan", target: 45000000, current: 28378000, period: "Bulan ini" },
];
