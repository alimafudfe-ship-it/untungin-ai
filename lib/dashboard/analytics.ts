import type { DashboardMetrics, Expense, Product, Tone } from "@/types/dashboard";
import { daysUntilOut, getRestockRecommendation, productDecision } from "./calculations";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function formatShortDate(date: string) {
  // Tambahkan handling jika string date tidak valid saat build
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
  } catch (e) {
    return "-";
  }
}

export function getExpenseBreakdown(expenses: Expense[] = []) {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const totals = new Map<string, number>();
  
  safeExpenses.forEach((expense) => {
    if (expense && expense.category) {
      totals.set(expense.category, (totals.get(expense.category) || 0) + (expense.amount || 0));
    }
  });

  const tones: Tone[] = ["warning", "blue", "success", "danger", "neutral", "muted"];
  return Array.from(totals.entries())
    .map(([label, value], index) => ({ label, value, tone: tones[index % tones.length] }))
    .sort((a, b) => b.value - a.value);
}

export function getCashflowTrend(products: Product[] = [], expenses: Expense[] = [], days = 7) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  const revenue = safeProducts.reduce((acc, item) => acc + ((item?.sellingPrice || 0) * (item?.quantitySold || 0)), 0);
  const profit = safeProducts.reduce((acc, item) => acc + (item?.profit || 0), 0);
  const totalExpense = safeExpenses.reduce((acc, item) => acc + (item?.amount || 0), 0);
  
  const expenseByDate = new Map<string, number>();
  safeExpenses.forEach((expense) => {
    if (expense && expense.date) {
      expenseByDate.set(expense.date, (expenseByDate.get(expense.date) || 0) + (expense.amount || 0));
    }
  });

  return Array.from({ length: days }, (_, index) => {
    const remaining = days - index - 1;
    const date = daysAgo(remaining);
    const multiplier = (index + 1) / days;
    const dailyExpense = expenseByDate.get(date) || (totalExpense / Math.max(days, 1)) * (0.72 + index * 0.05);
    return {
      label: formatShortDate(date),
      value: Math.round((profit || revenue * 0.28) * multiplier / days + revenue * 0.015 * (index + 1)),
      secondary: Math.round(dailyExpense),
    };
  });
}

export function getProfitTrend(products: Product[] = [], days = 7) {
  const safeProducts = Array.isArray(products) ? products : [];
  const totalProfit = safeProducts.reduce((acc, item) => acc + (item?.profit || 0), 0);

  return Array.from({ length: days }, (_, index) => {
    const remaining = days - index - 1;
    const date = daysAgo(remaining);
    const factor = 0.72 + index * 0.09;
    return { 
      label: formatShortDate(date), 
      value: Math.max(0, Math.round((totalProfit / Math.max(days, 1)) * factor)) 
    };
  });
}

export function getProductAnalytics(products: Product[] = []) {
  const safeProducts = Array.isArray(products) ? products : [];
  const sorted = [...safeProducts].sort((a, b) => (b?.profit || 0) - (a?.profit || 0));
  
  return sorted.slice(0, 5).map((product) => ({
    label: product?.name || "Produk Tanpa Nama",
    value: product?.profit || 0,
    helper: `${product?.marketplace || "Manual"} · Margin ${(product?.margin || 0).toFixed(1)}% · ${productDecision(product)}`,
    tone: (product?.profit || 0) >= 0 ? ("success" as const) : ("danger" as const),
  }));
}

export function getInventoryAnalytics(products: Product[] = []) {
  const safeProducts = Array.isArray(products) ? products : [];
  return [...safeProducts]
    .sort((a, b) => (daysUntilOut(a) ?? 9999) - (daysUntilOut(b) ?? 9999))
    .slice(0, 5)
    .map((product) => ({
      label: product?.name || "Produk Tanpa Nama",
      value: (product?.stockRemaining || 0) * (product?.costPrice || 0),
      helper: `Stok ${product?.stockRemaining || 0} · Estimasi habis ${daysUntilOut(product) ?? "-"} hari · ${getRestockRecommendation(product)}`,
      tone: (product?.stockRemaining || 0) <= 5 || (product?.stockRemaining || 0) <= (product?.stockInitial || 0) * 0.15 ? ("warning" as const) : ("neutral" as const),
    }));
}

export function getReportSummary(products: Product[] = [], expenses: Expense[] = [], metrics?: DashboardMetrics) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  
  const expenseBreakdown = getExpenseBreakdown(safeExpenses);
  const topProduct = [...safeProducts].sort((a, b) => (b?.profit || 0) - (a?.profit || 0))[0];
  const worstProduct = [...safeProducts].sort((a, b) => (a?.profit || 0) - (b?.profit || 0))[0];
  
  return {
    generatedAt: new Date().toISOString(),
    period: "Bulan berjalan",
    metrics: metrics || { totalRevenue: 0, totalProfit: 0, effectiveMargin: 0 },
    topProduct: topProduct ? { name: topProduct.name, profit: topProduct.profit, margin: topProduct.margin } : null,
    worstProduct: worstProduct ? { name: worstProduct.name, profit: worstProduct.profit, margin: worstProduct.margin } : null,
    expenseBreakdown,
  };
}
