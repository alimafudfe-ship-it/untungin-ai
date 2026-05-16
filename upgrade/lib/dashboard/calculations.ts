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

export function getDashboardMetrics(products: Product[], expenses: Expense[]): DashboardMetrics {
  const totalProfit = products.reduce((acc, item) => acc + item.profit, 0);
  const totalRevenue = products.reduce((acc, item) => acc + item.sellingPrice * item.quantitySold, 0);
  const totalUnits = products.reduce((acc, item) => acc + item.quantitySold, 0);
  const totalStock = products.reduce((acc, item) => acc + item.stockRemaining, 0);
  const inventoryValue = products.reduce((acc, item) => acc + item.stockRemaining * item.costPrice, 0);
  const totalExpenses = expenses.reduce((acc, item) => acc + item.amount, 0);
  const netCash = totalProfit - totalExpenses;
  const avgMargin = products.length ? products.reduce((acc, item) => acc + item.margin, 0) / products.length : 0;
  const lowStock = products.filter((item) => item.stockInitial > 0 && item.stockRemaining > 0 && (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15));
  const outOfStock = products.filter((item) => item.stockInitial > 0 && item.stockRemaining <= 0);
  const loss = products.filter((item) => item.profit < 0);
  const profitLeak = products.reduce((acc, item) => {
    if (item.margin >= 20) return acc;
    const safeProfit = item.sellingPrice * item.quantitySold * 0.2 - item.otherCost;
    return acc + Math.max(0, safeProfit - item.profit);
  }, 0);
  const dailyLeakEstimate = Math.max(Math.round(Math.max(profitLeak * 4, products.length * 50000) / 30), products.length * 2500);
  const riskScore = clamp(Math.round((loss.length / Math.max(products.length, 1)) * 40 + (products.filter((item) => item.margin < 15).length / Math.max(products.length, 1)) * 28 + (lowStock.length + outOfStock.length > 0 ? 16 : 0) + (netCash < 0 ? 16 : 0)), 0, 100);
  return { totalProfit, totalRevenue, totalUnits, totalStock, inventoryValue, totalExpenses, netCash, avgMargin, riskScore, dailyLeakEstimate, lowStockCount: lowStock.length, outOfStockCount: outOfStock.length, lossCount: loss.length };
}
