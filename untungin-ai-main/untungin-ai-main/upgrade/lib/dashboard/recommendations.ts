import type { DashboardMetrics, Expense, Product, Tone } from "@/types/dashboard";
import { daysUntilOut, getRestockRecommendation, productDecision, recommendedPrice } from "./calculations";
import { compactMoney, money, percent } from "./format";

export type Recommendation = {
  id: string;
  title: string;
  severity: Tone;
  category: "scale" | "stop" | "restock" | "pricing" | "cashflow" | "expense" | "inventory";
  message: string;
  action: string;
  impact: string;
};

export type ForecastPoint = {
  label: string;
  revenue: number;
  profit: number;
  expenses: number;
  netCash: number;
};

export type MarketplaceStat = {
  marketplace: string;
  revenue: number;
  profit: number;
  stock: number;
  units: number;
  margin: number;
};

function shortId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

export function buildRecommendations(products: Product[], expenses: Expense[], metrics: DashboardMetrics): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const sortedByProfit = [...products].sort((a, b) => b.profit - a.profit);
  const sortedByWorst = [...products].sort((a, b) => a.profit - b.profit);
  const expenseRatio = metrics.totalProfit > 0 ? (metrics.totalExpenses / metrics.totalProfit) * 100 : 0;

  sortedByProfit.slice(0, 3).forEach((product, index) => {
    const daysLeft = daysUntilOut(product) ?? 999;
    if (product.profit > 0 && product.margin >= 30 && daysLeft >= 21) {
      recommendations.push({
        id: shortId("scale", index),
        title: `Scale ${product.name}`,
        severity: "success",
        category: "scale",
        message: `${product.name} punya margin ${percent(product.margin)} dan estimasi stok aman ${daysLeft} hari.`,
        action: "Naikkan budget iklan bertahap 10-15% dan pantau ROAS minimal 3 hari.",
        impact: `Potensi scale aman dengan profit saat ini ${money(product.profit)}.`,
      });
    }
  });

  sortedByWorst.slice(0, 3).forEach((product, index) => {
    if (product.profit < 0 || product.margin < 12) {
      recommendations.push({
        id: shortId("fix", index),
        title: `Perbaiki ${product.name}`,
        severity: product.profit < 0 ? "danger" : "warning",
        category: product.profit < 0 ? "stop" : "pricing",
        message: `${product.name} margin ${percent(product.margin)} dengan profit ${money(product.profit)}.`,
        action: `Harga aman minimum ${money(recommendedPrice(product))}. ${productDecision(product)} sebelum restock.` ,
        impact: "Mengurangi kebocoran profit dari produk margin tipis.",
      });
    }
  });

  products
    .map((product) => ({ product, daysLeft: daysUntilOut(product) }))
    .filter((item) => item.daysLeft !== null && item.daysLeft <= 14)
    .slice(0, 4)
    .forEach(({ product, daysLeft }, index) => {
      recommendations.push({
        id: shortId("restock", index),
        title: `Restock alert: ${product.name}`,
        severity: daysLeft !== null && daysLeft <= 7 ? "danger" : "warning",
        category: "restock",
        message: `Stok ${product.name} diperkirakan habis dalam ${daysLeft} hari.`,
        action: getRestockRecommendation(product),
        impact: `Inventory value produk ini ${money(product.stockRemaining * product.costPrice)}.`,
      });
    });

  if (expenseRatio > 35) {
    const biggestExpense = [...expenses].sort((a, b) => b.amount - a.amount)[0];
    recommendations.push({
      id: "expense-control",
      title: "Kontrol biaya operasional",
      severity: expenseRatio > 55 ? "danger" : "warning",
      category: "expense",
      message: `Expense ratio ${expenseRatio.toFixed(0)}% dari profit produk.`,
      action: biggestExpense ? `Audit biaya terbesar: ${biggestExpense.label} (${money(biggestExpense.amount)}).` : "Audit biaya terbesar minggu ini.",
      impact: `Setiap penurunan expense 10% menambah cashflow sekitar ${money(metrics.totalExpenses * 0.1)}.`,
    });
  }

  if (metrics.netCash < 0) {
    recommendations.push({
      id: "cashflow-negative",
      title: "Cashflow negatif",
      severity: "danger",
      category: "cashflow",
      message: `Cashflow bersih saat ini ${money(metrics.netCash)}.`,
      action: "Tunda restock produk margin rendah dan potong biaya non-esensial.",
      impact: "Menjaga modal kerja agar tidak terkunci di stok lambat bergerak.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "healthy",
      title: "Bisnis dalam kondisi sehat",
      severity: "success",
      category: "cashflow",
      message: `Cashflow ${money(metrics.netCash)}, margin rata-rata ${percent(metrics.avgMargin)}, dan risk score ${metrics.riskScore}/100.`,
      action: "Lanjutkan scale bertahap pada produk terbaik dan tetap catat expense harian.",
      impact: "Menjaga keputusan tetap berbasis profit, bukan hanya omzet.",
    });
  }

  return recommendations.slice(0, 8);
}

export function getMarketplaceStats(products: Product[]): MarketplaceStat[] {
  const map = new Map<string, MarketplaceStat>();
  products.forEach((product) => {
    const marketplace = product.marketplace || "Manual";
    const current = map.get(marketplace) || { marketplace, revenue: 0, profit: 0, stock: 0, units: 0, margin: 0 };
    current.revenue += product.sellingPrice * product.quantitySold;
    current.profit += product.profit;
    current.stock += product.stockRemaining;
    current.units += product.quantitySold;
    map.set(marketplace, current);
  });
  return Array.from(map.values())
    .map((item) => ({ ...item, margin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0 }))
    .sort((a, b) => b.profit - a.profit);
}

export function buildForecast(products: Product[], expenses: Expense[], days = 30): ForecastPoint[] {
  const revenue = products.reduce((acc, item) => acc + item.sellingPrice * item.quantitySold, 0);
  const profit = products.reduce((acc, item) => acc + item.profit, 0);
  const expense = expenses.reduce((acc, item) => acc + item.amount, 0);
  const dailyRevenue = revenue / 30;
  const dailyProfit = profit / 30;
  const dailyExpense = expense / 30;
  const growth = profit > 0 ? 0.006 : 0.002;
  return Array.from({ length: days }, (_, index) => {
    const factor = 1 + growth * index;
    const seasonal = 1 + Math.sin(index / 4) * 0.04;
    const revenuePoint = Math.max(0, dailyRevenue * factor * seasonal);
    const profitPoint = Math.max(0, dailyProfit * factor * seasonal);
    const expensePoint = Math.max(0, dailyExpense * (1 + Math.sin(index / 6) * 0.03));
    return {
      label: `H+${index + 1}`,
      revenue: Math.round(revenuePoint),
      profit: Math.round(profitPoint),
      expenses: Math.round(expensePoint),
      netCash: Math.round(profitPoint - expensePoint),
    };
  });
}

export function getForecastSummary(forecast: ForecastPoint[]) {
  const revenue = forecast.reduce((acc, item) => acc + item.revenue, 0);
  const profit = forecast.reduce((acc, item) => acc + item.profit, 0);
  const expenses = forecast.reduce((acc, item) => acc + item.expenses, 0);
  const netCash = forecast.reduce((acc, item) => acc + item.netCash, 0);
  return { revenue, profit, expenses, netCash, label: `${compactMoney(netCash)} proyeksi net cash 30 hari` };
}
