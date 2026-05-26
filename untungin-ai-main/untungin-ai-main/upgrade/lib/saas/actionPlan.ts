import type { DashboardMetrics, Expense, Product, Tone } from "@/types/dashboard";
import { money, percent } from "@/lib/dashboard/format";

export type FounderAction = {
  id: string;
  title: string;
  owner: "Owner" | "Finance" | "Operator" | "Growth";
  urgency: "Hari ini" | "Minggu ini" | "Monitor";
  impact: "Revenue" | "Profit" | "Cashflow" | "Retention" | "Risk";
  detail: string;
  successMetric: string;
  tone: Tone;
};

export type GrowthMetric = {
  label: string;
  value: string;
  helper: string;
  tone: Tone;
};

function getTopProduct(products: Product[]) {
  return [...products].sort((a, b) => b.profit - a.profit)[0];
}

function getLowStock(products: Product[]) {
  return products
    .filter((item) => item.stockInitial > 0 && (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15))
    .sort((a, b) => a.stockRemaining - b.stockRemaining);
}

export function buildFounderActionPlan(products: Product[], expenses: Expense[], metrics: DashboardMetrics): FounderAction[] {
  const actions: FounderAction[] = [];
  const topProduct = getTopProduct(products);
  const lowStock = getLowStock(products)[0];
  const adsExpense = expenses
    .filter((item) => item.category.toLowerCase().includes("ads") || item.label.toLowerCase().includes("iklan"))
    .reduce((sum, item) => sum + item.amount, 0);
  const expensePressure = metrics.totalProfit > 0 ? (metrics.totalExpenses / metrics.totalProfit) * 100 : 0;

  if (metrics.netCash < 0) {
    actions.push({
      id: "cashflow-negative",
      title: "Tahan scale sampai cashflow positif",
      owner: "Owner",
      urgency: "Hari ini",
      impact: "Cashflow",
      detail: `Net cash saat ini ${money(metrics.netCash)}. Jangan tambah iklan besar sebelum biaya, retur, dan piutang marketplace dibaca ulang.`,
      successMetric: "Net cash positif dalam 7 hari",
      tone: "danger",
    });
  }

  if (lowStock) {
    actions.push({
      id: "restock-critical",
      title: `Restock ${lowStock.name}`,
      owner: "Operator",
      urgency: "Hari ini",
      impact: "Revenue",
      detail: `Stok tinggal ${lowStock.stockRemaining} pcs. Jika produk ini tetap jalan, buat reorder sebelum campaign berikutnya.`,
      successMetric: "Stok aman minimal 14 hari",
      tone: "warning",
    });
  }

  if (topProduct && topProduct.profit > 0) {
    actions.push({
      id: "scale-winner",
      title: `Scale pemenang: ${topProduct.name}`,
      owner: "Growth",
      urgency: "Minggu ini",
      impact: "Profit",
      detail: `Profit ${money(topProduct.profit)} dengan margin ${percent(topProduct.margin)}. Naikkan budget bertahap dan cek stok sebelum scale.`,
      successMetric: "Profit per SKU naik 10 persen",
      tone: "success",
    });
  }

  if (expensePressure > 35 || adsExpense > metrics.totalProfit * 0.25) {
    actions.push({
      id: "audit-expense",
      title: "Audit iklan, voucher, dan fee marketplace",
      owner: "Finance",
      urgency: "Hari ini",
      impact: "Risk",
      detail: `Expense ${money(metrics.totalExpenses)} dan iklan ${money(adsExpense)} perlu dibandingkan dengan profit asli, bukan omzet.`,
      successMetric: "Expense pressure di bawah 30 persen",
      tone: "warning",
    });
  }

  if (products.length === 0) {
    actions.push({
      id: "activate-real-data",
      title: "Import CSV marketplace pertama",
      owner: "Owner",
      urgency: "Hari ini",
      impact: "Retention",
      detail: "Produk ini harus membuktikan value dalam 5 menit: upload CSV, lihat profit asli, lalu dapat action plan.",
      successMetric: "Time-to-first-insight di bawah 5 menit",
      tone: "blue",
    });
  }

  actions.push({
    id: "daily-briefing",
    title: "Kirim daily briefing ke owner",
    owner: "Owner",
    urgency: "Monitor",
    impact: "Retention",
    detail: "Setiap pagi owner perlu satu pesan: profit kemarin, risiko hari ini, dan keputusan paling penting.",
    successMetric: "Owner buka briefing 5 hari per minggu",
    tone: "blue",
  });

  return actions.slice(0, 5);
}

export function buildGrowthMetrics(products: Product[], metrics: DashboardMetrics): GrowthMetric[] {
  const activationScore = products.length > 0 ? 84 : 18;
  const insightScore = products.length > 0 ? Math.max(45, Math.min(96, 100 - metrics.riskScore + 10)) : 25;
  const monetizationScore = metrics.netCash > 0 && products.length > 1 ? 72 : 38;
  const retentionScore = metrics.lowStockCount > 0 || metrics.totalProfit > 0 ? 68 : 30;

  return [
    { label: "Activation", value: `${activationScore}/100`, helper: "CSV ke insight pertama", tone: activationScore >= 70 ? "success" : "warning" },
    { label: "AI value", value: `${Math.round(insightScore)}/100`, helper: "Kualitas keputusan harian", tone: insightScore >= 70 ? "success" : "blue" },
    { label: "Monetization", value: `${monetizationScore}/100`, helper: "Siap upgrade PRO", tone: monetizationScore >= 70 ? "success" : "warning" },
    { label: "Retention", value: `${retentionScore}/100`, helper: "Alasan balik besok", tone: retentionScore >= 65 ? "success" : "blue" },
  ];
}
