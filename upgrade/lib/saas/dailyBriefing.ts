import type { DashboardMetrics, Expense, Product } from "@/types/dashboard";
import { money, percent } from "@/lib/dashboard/format";

export function buildDailyBriefing(products: Product[], expenses: Expense[], metrics: DashboardMetrics) {
  const topProduct = [...products].sort((a, b) => b.profit - a.profit)[0];
  const lowStock = products.filter((item) => item.stockInitial > 0 && (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15));
  const adsExpense = expenses.filter((item) => item.category.toLowerCase().includes("ads") || item.label.toLowerCase().includes("iklan")).reduce((acc, item) => acc + item.amount, 0);
  const expensePressure = metrics.totalProfit > 0 ? (metrics.totalExpenses / metrics.totalProfit) * 100 : 0;
  const riskFlags: string[] = [];
  if (metrics.netCash < 0) riskFlags.push("Cashflow negatif");
  if (lowStock.length > 0) riskFlags.push(`${lowStock.length} SKU stok kritis`);
  if (expensePressure > 35) riskFlags.push(`Expense tinggi: ${percent(expensePressure)} dari profit`);
  if (adsExpense > metrics.totalProfit * 0.25) riskFlags.push("Iklan perlu diaudit");

  const priorityAction = topProduct
    ? `Scale ${topProduct.name} jika stok aman. Profit ${money(topProduct.profit)} dengan margin ${percent(topProduct.margin)}.`
    : "Import CSV marketplace pertama agar AI bisa membaca profit asli.";

  return {
    title: "Briefing bisnis hari ini",
    summary: `Net cash ${money(metrics.netCash)}, omzet ${money(metrics.totalRevenue)}, profit produk ${money(metrics.totalProfit)}, stok tersedia ${metrics.totalStock} unit.`,
    priority_action: priorityAction,
    risk_flags: riskFlags,
    metric_snapshot: {
      totalRevenue: metrics.totalRevenue,
      totalProfit: metrics.totalProfit,
      totalExpenses: metrics.totalExpenses,
      netCash: metrics.netCash,
      avgMargin: metrics.avgMargin,
      lowStockCount: lowStock.length,
      products: products.length,
    },
  };
}
