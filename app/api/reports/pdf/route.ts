import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";
import { buildReportSummary, rupiah } from "@/lib/reports/reportData";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const { metrics, top, expenses } = buildReportSummary(payload);
  const doc = new PDFDocument({ margin: 48, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
  doc.fontSize(22).text("Untungin.ai Business Report", { align: "left" });
  doc.moveDown(0.5).fontSize(10).fillColor("#667085").text(`Generated: ${new Date().toLocaleString("id-ID")}`);
  doc.moveDown().fillColor("#111827").fontSize(14).text("Ringkasan KPI");
  const lines = [
    ["Omzet", metrics.totalRevenue],
    ["Profit", metrics.totalProfit],
    ["Expenses", metrics.totalExpenses],
    ["Cashflow Bersih", metrics.netCash],
    ["Inventory Value", metrics.inventoryValue],
  ];
  lines.forEach(([k, v]) => doc.fontSize(11).text(`${k}: ${rupiah(Number(v || 0))}`));
  doc.moveDown().fontSize(14).text("Top Produk");
  top.forEach((p: any, i: number) => doc.fontSize(10).text(`${i + 1}. ${p.name} - Profit ${rupiah(Number(p.profit || 0))} - Margin ${Number(p.margin || 0).toFixed(1)}%`));
  doc.moveDown().fontSize(14).text("Expense Terbaru");
  expenses.slice(0, 10).forEach((e: any, i: number) => doc.fontSize(10).text(`${i + 1}. ${e.title || e.label} - ${e.category} - ${rupiah(Number(e.amount || 0))}`));
  doc.moveDown().fontSize(12).fillColor("#0f766e").text("AI Action: scale produk margin sehat, tahan restock produk rugi, dan pantau expense iklan mingguan.");
  doc.end();
  const pdf = await done;
  return new NextResponse(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="untungin-report-${new Date().toISOString().slice(0,10)}.pdf"` } });
}
