import type { DashboardMetrics, Expense, Product } from "@/types/dashboard";
import { daysUntilOut, getRestockRecommendation, productDecision, recommendedPrice } from "./calculations";
import { money, percent } from "./format";

export function getOneThingAction(products: Product[]) {
  const lossProduct = products.find((item) => item.profit < 0);
  if (lossProduct) return `Evaluasi ${lossProduct.name} sebelum tambah stok.`;
  const lowStockProduct = products.find((item) => item.stockInitial > 0 && item.stockRemaining > 0 && (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15));
  if (lowStockProduct) return `Siapkan restock ${lowStockProduct.name}.`;
  const bestProduct = [...products].sort((a, b) => b.profit - a.profit)[0];
  return bestProduct ? `Scale bertahap ${bestProduct.name}.` : "Tambahkan produk pertama untuk mulai analisis.";
}

export function generateInsightText(products: Product[], expenses: Expense[], metrics: DashboardMetrics, question: string) {
  if (products.length === 0) return "Tambahkan minimal 1 produk dulu agar insight bisa membaca profit, stok, margin, dan cashflow.";
  const sorted = [...products].sort((a, b) => b.profit - a.profit);
  const worst = [...products].sort((a, b) => a.profit - b.profit)[0];
  const stockLines = products
    .filter((item) => item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15)
    .slice(0, 5)
    .map((item) => `- ${item.name}: stok ${item.stockRemaining}, saran ${getRestockRecommendation(item)}`)
    .join("\n") || "- Tidak ada stok kritis.";
  const priceLines = sorted.slice(0, 6).map((item) => `- ${item.name}: ${productDecision(item)}; harga aman ${money(recommendedPrice(item))}; margin ${percent(item.margin)}; ${getRestockRecommendation(item)}.`).join("\n");
  const topExpense = [...expenses].sort((a, b) => b.amount - a.amount)[0];
  const expenseLine = topExpense ? `Biaya terbesar adalah ${topExpense.label} sebesar ${money(topExpense.amount)}.` : "Belum ada biaya operasional tercatat.";
  const ask = question.trim() || "Buat ringkasan bisnis hari ini.";
  return `Pertanyaan:\n${ask}\n\nRingkasan eksekutif:\nOmzet ${money(metrics.totalRevenue)}, profit produk ${money(metrics.totalProfit)}, biaya operasional ${money(metrics.totalExpenses)}, cashflow bersih ${money(metrics.netCash)}, margin rata-rata ${percent(metrics.avgMargin)}, inventory value ${money(metrics.inventoryValue)}.\n\nPrioritas hari ini:\n${getOneThingAction(products)}\n\nRisiko utama:\nRisk score ${metrics.riskScore}/100. ${worst ? `${worst.name} adalah produk dengan performa terendah (${money(worst.profit)}).` : "Belum ada produk terendah."} ${expenseLine} Estimasi profit leak ${money(metrics.dailyLeakEstimate)} per hari jika produk margin tipis tidak diperbaiki.\n\nKontrol stok:\n${stockLines}\n\nPricing dan scale plan:\n${priceLines}\n\nKeputusan:\nScale hanya produk profit positif dengan margin minimal 20%. Tahan restock produk rugi atau margin di bawah 10%. Catat semua biaya operasional agar cashflow tidak terlihat semu.`;
}

export function buildInsightCards(products: Product[], metrics: DashboardMetrics) {
  const cards = [];
  const best = [...products].sort((a, b) => b.profit - a.profit)[0];
  if (best && best.margin >= 20) cards.push({ title: `Scale ${best.name}`, detail: `Margin ${percent(best.margin)} dan profit ${money(best.profit)}. Naikkan budget bertahap 10-15%.`, tone: "success" as const });
  const low = products.find((item) => item.stockInitial > 0 && item.stockRemaining <= item.stockInitial * 0.15);
  if (low) cards.push({ title: `Stok ${low.name} menipis`, detail: `Estimasi habis ${daysUntilOut(low) ?? 0} hari. Prioritaskan restock jika margin aman.`, tone: "warning" as const });
  if (metrics.netCash < 0) cards.push({ title: "Cashflow negatif", detail: "Biaya operasional lebih besar dari profit produk. Review ads, packing, dan fee.", tone: "danger" as const });
  if (cards.length === 0) cards.push({ title: "Operasional sehat", detail: "Tidak ada risiko besar hari ini. Fokus scale produk paling profitable.", tone: "success" as const });
  return cards;
}
