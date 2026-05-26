export type InsightInputProduct = { name: string; profit: number; margin: number; stockRemaining: number; stockInitial: number; otherCost?: number; marketplace?: string };
export type InsightInputExpense = { label: string; category: string; amount: number };
export type GeneratedInsight = { severity: "info" | "success" | "warning" | "danger"; title: string; body: string; actionLabel: string; score: number };

export function generateRuleBasedInsights(products: InsightInputProduct[], expenses: InsightInputExpense[] = []): GeneratedInsight[] {
  const revenueLike = products.reduce((sum, p) => sum + Math.max(0, Number(p.profit || 0)), 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const lowStock = products
    .filter((p) => Number(p.stockRemaining || 0) <= 5 || Number(p.stockRemaining || 0) <= Number(p.stockInitial || 0) * 0.15)
    .sort((a, b) => Number(a.stockRemaining || 0) - Number(b.stockRemaining || 0))[0];
  const loss = products.filter((p) => Number(p.profit || 0) < 0).sort((a, b) => Number(a.profit || 0) - Number(b.profit || 0))[0];
  const winner = [...products].sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0))[0];
  const feeHeavy = products.filter((p) => Number(p.otherCost || 0) > 0).sort((a, b) => Number(b.otherCost || 0) - Number(a.otherCost || 0))[0];

  const insights: GeneratedInsight[] = [];
  if (loss) insights.push({ severity: "danger", title: "Produk rugi terdeteksi", body: `${loss.name} sedang negatif. Cek HPP, voucher, fee marketplace, dan biaya iklan sebelum restock.`, actionLabel: "Audit margin", score: 95 });
  if (lowStock) insights.push({ severity: "warning", title: "Stok hampir habis", body: `${lowStock.name} tinggal ${lowStock.stockRemaining} pcs. Siapkan reorder agar momentum penjualan tidak putus.`, actionLabel: "Buat restock plan", score: 88 });
  if (expenseTotal > revenueLike * 0.35 && expenseTotal > 0) insights.push({ severity: "warning", title: "Expense pressure tinggi", body: `Biaya operasional sudah besar dibanding profit. Review iklan, voucher, affiliate, dan biaya admin marketplace.`, actionLabel: "Review biaya", score: 82 });
  if (feeHeavy) insights.push({ severity: "info", title: "Fee marketplace perlu diawasi", body: `${feeHeavy.name} punya biaya tambahan paling besar. Pastikan harga jual sudah memasukkan admin fee, gratis ongkir, dan voucher.`, actionLabel: "Update pricing", score: 72 });
  if (winner) insights.push({ severity: "success", title: "Produk siap di-scale", body: `${winner.name} adalah kandidat scale karena profit paling kuat. Tambahkan stok dan uji budget iklan bertahap.`, actionLabel: "Scale bertahap", score: 68 });
  if (!insights.length) insights.push({ severity: "info", title: "Mulai dari data real", body: "Import CSV marketplace pertama untuk membuka insight profit, stok, dan cashflow yang lebih akurat.", actionLabel: "Import CSV", score: 50 });
  return insights.slice(0, 5);
}
