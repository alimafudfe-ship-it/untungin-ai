import type { DashboardMetrics, Expense, Product } from "@/types/dashboard";
import { getExpenseBreakdown, getInventoryAnalytics, getProductAnalytics } from "@/lib/dashboard/analytics";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle, Progress, StatCard } from "./ui";
import { AnalyticsTable, DonutChartCard } from "./Charts";

export function ReportsPanel({ metrics, products, expenses, onExportCSV, onExportPDF }: { metrics: DashboardMetrics; products: Product[]; expenses: Expense[]; onExportCSV: () => void; onExportPDF: () => void }) {
  const expenseBreakdown = getExpenseBreakdown(expenses);
  const productRows = getProductAnalytics(products);
  const inventoryRows = getInventoryAnalytics(products);

  // 🛡️ REFACTORING PENGAMAN DATA MENTAH
  const safeExpenses = Number(metrics?.totalExpenses) || 0;
  const safeProfit = Number(metrics?.totalProfit) || 0;

  const expenseRatio = safeProfit > 0 ? (safeExpenses / safeProfit) * 100 : 0;

  // 🛡️ TAMBAHAN PENGAMAN UNTUK RISK SCORE (Bypass snake_case / camelCase & undefined)
  const safeRiskScore = metrics?.riskScore !== undefined 
    ? metrics.riskScore 
    : (metrics as any)?.risk_score !== undefined 
      ? (metrics as any).risk_score 
      : 0;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ ...cardStyle, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <Badge label="Reports Center" tone="success" />
          <h2 style={{ margin: "10px 0 4px" }}>Laporan bisnis siap export</h2>
          <p style={{ color: "#64748b", margin: 0, lineHeight: 1.7 }}>Export cashflow, expenses, produk, dan laporan printable untuk disimpan sebagai PDF.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onExportCSV} style={ghostButtonStyle}>Export CSV Bundle</button>
          <button onClick={onExportPDF} style={ctaButtonStyle}>Print / Save PDF</button>
        </div>
      </section>

      <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard label="Cashflow bersih" value={money(metrics.netCash)} helper="Profit dikurangi expenses" tone={metrics.netCash >= 0 ? "success" : "danger"} />
        <StatCard label="Expense ratio" value={`${Math.round(expenseRatio)}%`} helper="Expenses dibanding profit produk" tone={expenseRatio > 45 ? "danger" : expenseRatio > 25 ? "warning" : "success"} />
        <StatCard label="Inventory value" value={compactMoney(metrics.inventoryValue)} helper="Modal masih berada di stok" tone="neutral" />
        <StatCard label="Risk score" value={`${metrics.riskScore}/100`} helper="Profit, stok, expense, cashflow" tone={metrics.riskScore >= 50 ? "danger" : metrics.riskScore >= 25 ? "warning" : "success"} />
      </section>

      <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={cardStyle}>
          <Badge label="Monthly Summary" tone="blue" />
          <h3 style={{ margin: "12px 0" }}>Ringkasan bulan berjalan</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <ReportLine label="Omzet" value={metrics.totalRevenue} total={Math.max(metrics.totalRevenue, metrics.inventoryValue, 1)} />
            <ReportLine label="Profit produk" value={metrics.totalProfit} total={Math.max(metrics.totalRevenue, 1)} tone="success" />
            <ReportLine label="Biaya operasional" value={metrics.totalExpenses} total={Math.max(metrics.totalProfit, 1)} tone="warning" />
            <ReportLine label="Cashflow bersih" value={metrics.netCash} total={Math.max(metrics.totalRevenue, 1)} tone={metrics.netCash >= 0 ? "success" : "danger"} />
          </div>
        </div>
        <DonutChartCard title="Expense Breakdown" subtitle="Komposisi biaya operasional" segments={expenseBreakdown} centerLabel={compactMoney(metrics.totalExpenses)} />
      </section>

      <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <AnalyticsTable title="Profit Analytics" rows={productRows} />
        <AnalyticsTable title="Inventory Analytics" rows={inventoryRows} />
      </section>
    </div>
  );
}

function ReportLine({ label, value, total, tone = "neutral" }: { label: string; value: number; total: number; tone?: "success" | "warning" | "danger" | "neutral" }) {
  const color = tone === "success" ? "#0f766e" : tone === "warning" ? "#d97706" : tone === "danger" ? "#dc2626" : "#0f172a";
  return (
    <div style={{ display: "grid", gap: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: "#64748b" }}>{label}</span><strong style={{ color }}>{money(value)}</strong></div>
      <Progress value={Math.abs(value) / Math.max(total, 1) * 100} />
    </div>
  );
}
