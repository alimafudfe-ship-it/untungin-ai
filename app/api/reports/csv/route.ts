import { NextResponse } from "next/server";
import { buildReportSummary } from "@/lib/reports/reportData";

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const { products, expenses, metrics } = buildReportSummary(payload);
  const productRows = [["TYPE", "NAME", "MARKETPLACE", "REVENUE", "PROFIT", "STOCK", "MARGIN"], ...products.map((p: any) => ["PRODUCT", p.name, p.marketplace || "Manual", Number(p.sellingPrice || 0) * Number(p.quantitySold || 0), p.profit, p.stockRemaining, p.margin])];
  const expenseRows = [["TYPE", "TITLE", "CATEGORY", "AMOUNT", "DATE"], ...expenses.map((e: any) => ["EXPENSE", e.title || e.label, e.category, e.amount, e.expense_date || e.date])];
  const metricRows = [["METRIC", "VALUE"], ...Object.entries(metrics || {})];
  const csv = [metricRows, [], productRows, [], expenseRows].flat().map((row: any) => Array.isArray(row) ? row.map(csvEscape).join(",") : "").join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="untungin-report-${new Date().toISOString().slice(0,10)}.csv"` } });
}
