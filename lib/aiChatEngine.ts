// ======================================
// UNTUNGIN AI - AI CHAT ENGINE
// ======================================

import { generateDailyDecisions } from "./decisionEngine";
import { getBusinessSummary } from "./metricsEngine";

export function generateAIResponse(
  question: string,
  products: any[],
  affiliatesMap: Record<string, any[]>
) {
  const q = question.toLowerCase();

  const decisions = generateDailyDecisions(products, affiliatesMap);
  const summary = getBusinessSummary(products);

  // =========================
  // PROFIT
  // =========================
  if (q.includes("profit")) {
    return {
      answer: `Total profit kamu saat ini sekitar Rp ${Math.round(
        summary.total_profit
      ).toLocaleString()}`,
    };
  }

  // =========================
  // PRODUK UNTUNG
  // =========================
  if (q.includes("produk") && q.includes("untung")) {
    const top = summary.top_products?.[0];

    return {
      answer: top
        ? `Produk paling menguntungkan adalah ${top.name}`
        : "Belum ada data produk",
    };
  }

  // =========================
  // PRODUK RUGI
  // =========================
  if (q.includes("rugi")) {
    const loss = summary.loss_products?.[0];

    return {
      answer: loss
        ? `Produk yang merugikan adalah ${loss.name}`
        : "Tidak ada produk merugi",
    };
  }

  // =========================
  // AFFILIATE
  // =========================
  if (q.includes("affiliate")) {
    let best: any = null;

    Object.values(affiliatesMap).forEach((list: any[]) => {
      list.forEach((a) => {
        if (!best || a.revenue > best.revenue) {
          best = a;
        }
      });
    });

    return {
      answer: best
        ? `Affiliate terbaik saat ini adalah ${best.name}`
        : "Belum ada data affiliate",
    };
  }

  // =========================
  // DECISION
  // =========================
  if (q.includes("apa") || q.includes("harus")) {
    return {
      answer:
        "Berikut 3 keputusan terbaik hari ini:\n" +
        decisions
          .map(
            (d, i) =>
              `${i + 1}. ${d.product} → ${d.action}`
          )
          .join("\n"),
    };
  }

  // =========================
  // DEFAULT
  // =========================
  return {
    answer:
      "Saya siap membantu. Coba tanya tentang profit, produk, atau affiliate.",
  };
}