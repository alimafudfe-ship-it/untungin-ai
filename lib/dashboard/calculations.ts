import type { DashboardMetrics, Expense, ExpenseRow, Product, ProductRow, Tone } from "@/types/dashboard";
import { clamp, parseNumber } from "./format";

export function calculateProfit(item: Pick<Product, "costPrice" | "sellingPrice" | "quantitySold" | "otherCost">) {
  return (item.sellingPrice - item.costPrice) * item.quantitySold - item.otherCost;
}

export function calculateMargin(costPrice: number, sellingPrice: number) {
  return sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;
}

export function mapProductRow(row: ProductRow): Product {
  const quantitySold = parseNumber(row.quantity_sold);
  const stockInitial = parseNumber(row.stock_initial) || quantitySold;
  const stockRemaining = row.stock_remaining === null || row.stock_remaining === undefined ? Math.max(stockInitial - quantitySold, 0) : parseNumber(row.stock_remaining);
  const costPrice = parseNumber(row.cost_price);
  const sellingPrice = parseNumber(row.selling_price);
  const otherCost = parseNumber(row.other_cost);
  const profit = row.profit === null || row.profit === undefined ? calculateProfit({ costPrice, sellingPrice, quantitySold, otherCost }) : parseNumber(row.profit);
  const margin = row.margin === null || row.margin === undefined ? calculateMargin(costPrice, sellingPrice) : parseNumber(row.margin);
  return { id: row.id, name: row.name || "Produk Tanpa Nama", costPrice, sellingPrice, quantitySold, stockInitial, stockRemaining, otherCost, profit, margin, marketplace: row.marketplace || "Manual" };
}

export function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    label: row.title || row.label || "Biaya tanpa nama",
    category: row.category || "Lainnya",
    amount: parseNumber(row.amount),
    date: (row.expense_date || row.date || new Date().toISOString()).slice(0, 10),
    productId: row.product_id || null,
    notes: row.notes || null,
  };
}

export function isProfilePro(profile: { plan?: string | null; pro_until?: string | null } | null) {
  return profile?.plan === "pro" && (!profile.pro_until || new Date(profile.pro_until) > new Date());
}

export function isProfileExpired(profile: { plan?: string | null; pro_until?: string | null } | null) {
  return profile?.plan === "pro" && !!profile.pro_until && new Date(profile.pro_until) <= new Date();
}

export function getHealth(item: Product): { label: string; tone: Tone } {
  if (item.profit < 0) return { label: "Rugi", tone: "danger" };
  if (item.margin < 10) return { label: "Kritis", tone: "warning" };
  if (item.margin < 20) return { label: "Optimasi", tone: "warning" };
  return { label: "Sehat", tone: "success" };
}

export function getStockStatus(item: Product): { label: string; tone: Tone } {
  if (item.stockInitial <= 0) return { label: "Belum diisi", tone: "muted" };
  const rate = (item.stockRemaining / Math.max(item.stockInitial, 1)) * 100;
  if (item.stockRemaining <= 0) return { label: "Habis", tone: "danger" };
  if (item.stockRemaining <= 5 || rate <= 15) return { label: "Menipis", tone: "warning" };
  return { label: "Aman", tone: "success" };
}

export function getRestockRecommendation(item: Product) {
  if (item.profit < 0 || item.margin < 10) return "Tahan restock";
  if (item.stockRemaining <= 0 && item.margin >= 20) return "Restock segera";
  if ((item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15) && item.margin >= 20) return "Restock";
  if (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15) return "Optimasi dulu";
  return "Pantau stok";
}

export function daysUntilOut(item: Product) {
  if (item.quantitySold <= 0) return null;
  const dailySales = Math.max(item.quantitySold / 30, 0.1);
  return Math.max(0, Math.ceil(item.stockRemaining / dailySales));
}

export function recommendedPrice(item: Product) {
  const unitOtherCost = item.otherCost / Math.max(item.quantitySold, 1);
  return Math.ceil((item.costPrice + unitOtherCost) / 0.75);
}

export function productDecision(item: Product) {
  if (item.profit < 0) return "Stop / evaluasi";
  if (item.margin < 10) return "Naikkan harga";
  if (item.margin < 20) return "Optimasi";
  return "Scale bertahap";
}

export function getDashboardMetrics(products: any[] = [], expenses: any[] = []) {
  // Amankan parameter agar selalu berupa array saat build
  const safeProducts = Array.isArray(products) ? products : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  // Gunakan optional chaining (?.) untuk menghindari crash jika properti object tidak ada
  const totalRevenue = safeProducts.reduce((acc, item) => acc + ((item?.sellingPrice || 0) * (item?.quantitySold || 0)), 0);
  const totalCost = safeProducts.reduce((acc, item) => acc + ((item?.costPrice || 0) * (item?.quantitySold || 0)), 0);
  const totalExpense = safeExpenses.reduce((acc, item) => acc + (item?.amount || 0), 0);

  const totalProfit = totalRevenue - totalCost - totalExpense;
  const effectiveMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalProfit,
    effectiveMargin,
  };
}
