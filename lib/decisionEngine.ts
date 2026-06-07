// ======================================
// UNTUNGIN AI - AI COO DECISION ENGINE
// ======================================

import { getBusinessSummary } from "./metricsEngine";

function safe(n: any) {
  return Number(n) || 0;
}

// ================================
// MAIN ENGINE
// ================================

export function generateDailyDecisions(
  products: any[],
  affiliatesMap: Record<string, any[]>
) {
  const decisions: any[] = [];

  const summary = getBusinessSummary(products);

  // =========================
  // 1. RESTOCK DECISION
  // =========================
  summary.low_stock?.forEach((p: any) => {
    decisions.push({
      type: "restock",
      priority: "high",
      product: p.name,
      reason: `Stok akan habis dalam ${Math.round(p.days_left)} hari`,
      action: `Restock sekarang untuk menghindari lost sales`,
    });
  });

  // =========================
  // 2. STOP LOSS PRODUCTS
  // =========================
  summary.loss_products?.forEach((p: any) => {
    decisions.push({
      type: "stop",
      priority: "high",
      product: p.name,
      reason: `Produk merugi ${Math.round(p.profit)}`,
      action: `Evaluasi harga atau hentikan produk`,
    });
  });

  // =========================
  // 3. SCALE WINNER PRODUCTS
  // =========================
  summary.top_products?.forEach((p: any) => {
    const affiliates = affiliatesMap[p.id] || [];

    const hasStrongAffiliate =
      affiliates.length > 0 &&
      affiliates.some((a) => safe(a.revenue) > 1000000);

    if (p.profit > 0 && p.margin > 0.2) {
      decisions.push({
        type: "scale",
        priority: "medium",
        product: p.name,
        reason: hasStrongAffiliate
          ? "Profit tinggi + affiliate kuat"
          : "Profit tinggi",
        action: hasStrongAffiliate
          ? "Tambahkan budget & scale affiliate"
          : "Naikkan ads atau exposure",
      });
    }
  });

  // =========================
  // SORT BY PRIORITY
  // =========================
  return decisions
    .sort((a, b) => {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, 3); // 👉 hanya 3 keputusan utama
}