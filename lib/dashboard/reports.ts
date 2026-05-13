import type { DashboardMetrics, Expense, Product } from "@/types/dashboard";
import { getRestockRecommendation, productDecision, recommendedPrice } from "./calculations";
import { getExpenseBreakdown, getReportSummary } from "./analytics";
import { money, percent } from "./format";

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvValue(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function exportProductsCSV(products: Product[]) {
  const headers = ["Nama Produk", "Marketplace", "Modal", "Harga Jual", "Terjual", "Stok", "Biaya Lain", "Profit", "Margin", "Keputusan", "Harga Aman", "Restock"];
  const rows = products.map((item) => [item.name, item.marketplace || "Manual", item.costPrice, item.sellingPrice, item.quantitySold, item.stockRemaining, item.otherCost, item.profit, `${item.margin.toFixed(1)}%`, productDecision(item), recommendedPrice(item), getRestockRecommendation(item)]);
  const csv = [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
  downloadBlob(`untungin-products-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8;");
}

export function exportExpensesCSV(expenses: Expense[]) {
  const headers = ["Tanggal", "Kategori", "Nama Biaya", "Nominal", "Catatan"];
  const rows = expenses.map((item) => [item.date, item.category, item.label, item.amount, item.notes || ""]);
  const csv = [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
  downloadBlob(`untungin-expenses-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8;");
}

export function exportCashflowCSV(metrics: DashboardMetrics, expenses: Expense[]) {
  const breakdown = getExpenseBreakdown(expenses);
  const rows = [
    ["Metric", "Value"],
    ["Omzet", metrics.totalRevenue],
    ["Profit Produk", metrics.totalProfit],
    ["Biaya Operasional", metrics.totalExpenses],
    ["Cashflow Bersih", metrics.netCash],
    ["Nilai Inventory", metrics.inventoryValue],
    ["Risk Score", metrics.riskScore],
    [],
    ["Expense Category", "Amount"],
    ...breakdown.map((item) => [item.label, item.value]),
  ];
  const csv = rows.map((row) => row.map(csvValue).join(",")).join("\n");
  downloadBlob(`untungin-cashflow-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8;");
}

export function exportSummaryJSON(metrics: DashboardMetrics, products: Product[], expenses: Expense[]) {
  downloadBlob(
    `untungin-summary-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(getReportSummary(products, expenses, metrics), null, 2),
    "application/json;charset=utf-8;"
  );
}

export function openPrintableReport(metrics: DashboardMetrics, products: Product[], expenses: Expense[]) {
  const report = getReportSummary(products, expenses, metrics);
  const topProducts = [...products].sort((a, b) => b.profit - a.profit).slice(0, 8);
  const expenseRows = getExpenseBreakdown(expenses);
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Untungin.ai Business Report</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; color: #0f172a; margin: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 24px; }
    h1 { margin: 0; font-size: 30px; }
    h2 { margin-top: 28px; font-size: 18px; }
    .muted { color: #64748b; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background: #f8fafc; }
    .value { font-size: 20px; font-weight: 800; color: #0f766e; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    th { color: #64748b; text-transform: uppercase; font-size: 11px; }
    @media print { button { display: none; } body { margin: 18px; } }
  </style>
</head>
<body>
  <button onclick="window.print()" style="float:right;padding:10px 14px;border-radius:10px;border:0;background:#0f172a;color:white;font-weight:800;">Print / Save PDF</button>
  <div class="header">
    <div><h1>Untungin.ai Business Report</h1><div class="muted">${report.period} · ${new Date(report.generatedAt).toLocaleString("id-ID")}</div></div>
    <div style="text-align:right"><strong>Seller Operating System</strong><div class="muted">Generated automatically</div></div>
  </div>
  <div class="grid">
    <div class="card"><div class="muted">Omzet</div><div class="value">${money(metrics.totalRevenue)}</div></div>
    <div class="card"><div class="muted">Profit Produk</div><div class="value">${money(metrics.totalProfit)}</div></div>
    <div class="card"><div class="muted">Biaya Operasional</div><div class="value" style="color:#d97706">${money(metrics.totalExpenses)}</div></div>
    <div class="card"><div class="muted">Cashflow Bersih</div><div class="value" style="color:${metrics.netCash >= 0 ? "#0f766e" : "#dc2626"}">${money(metrics.netCash)}</div></div>
  </div>
  <h2>Executive Summary</h2>
  <p>Margin rata-rata ${percent(metrics.avgMargin)}, risk score ${metrics.riskScore}/100, nilai inventory ${money(metrics.inventoryValue)}. Produk terbaik: ${report.topProduct?.name || "-"}. Produk yang perlu dievaluasi: ${report.worstProduct?.name || "-"}.</p>
  <h2>Top Products</h2>
  <table><thead><tr><th>Produk</th><th>Marketplace</th><th>Profit</th><th>Margin</th><th>Stok</th><th>Keputusan</th></tr></thead><tbody>${topProducts.map((item) => `<tr><td>${item.name}</td><td>${item.marketplace || "Manual"}</td><td>${money(item.profit)}</td><td>${percent(item.margin)}</td><td>${item.stockRemaining}</td><td>${productDecision(item)}</td></tr>`).join("")}</tbody></table>
  <h2>Expense Breakdown</h2>
  <table><thead><tr><th>Kategori</th><th>Nominal</th></tr></thead><tbody>${expenseRows.map((item) => `<tr><td>${item.label}</td><td>${money(item.value)}</td></tr>`).join("")}</tbody></table>
</body>
</html>`;
  const reportWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!reportWindow) {
    downloadBlob(`untungin-report-${new Date().toISOString().slice(0, 10)}.html`, html, "text/html;charset=utf-8;");
    return;
  }
  reportWindow.document.write(html);
  reportWindow.document.close();
}
