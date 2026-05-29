export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { buildReportSummary, rupiah } from "@/lib/reports/reportData";

export async function GET() {
  const report = buildReportSummary();

  const html = `
  <html>
    <head>
      <title>Untungin.ai Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
        h1 { margin-bottom: 4px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 24px; }
        .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px; }
        .label { color: #64748b; font-size: 13px; }
        .value { font-size: 28px; font-weight: 800; margin-top: 8px; }
      </style>
    </head>
    <body>
      <h1>Untungin.ai Business Report</h1>
      <p>Ringkasan profit, cashflow, expenses, dan inventory.</p>

      <div class="grid">
        <div class="card">
          <div class="label">Omzet</div>
          <div class="value">${rupiah(report.revenue)}</div>
        </div>
        <div class="card">
          <div class="label">Profit</div>
          <div class="value">${rupiah(report.profit)}</div>
        </div>
        <div class="card">
          <div class="label">Expenses</div>
          <div class="value">${rupiah(report.expenses)}</div>
        </div>
        <div class="card">
          <div class="label">Net Cashflow</div>
          <div class="value">${rupiah(report.netCashflow)}</div>
        </div>
      </div>

      <script>
        window.onload = () => window.print();
      </script>
    </body>
  </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
