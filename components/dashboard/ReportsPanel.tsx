import type { DashboardMetrics, Expense, Product } from "@/types/dashboard";
import { getExpenseBreakdown, getInventoryAnalytics, getProductAnalytics } from "@/lib/dashboard/analytics";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle, Progress, StatCard } from "./ui";
import { AnalyticsTable, DonutChartCard } from "./Charts";

// 🌟 DIUPDATE: Ditambahkan props accountMode untuk membedakan Seller & Affiliate
export function ReportsPanel({ 
  metrics, 
  products, 
  expenses, 
  accountMode = "seller", // default mode seller
  onExportCSV, 
  onExportPDF 
}: { 
  metrics: DashboardMetrics; 
  products: Product[]; 
  expenses: Expense[]; 
  accountMode?: "seller" | "affiliate"; 
  onExportCSV: () => void; 
  onExportPDF: () => void 
}) {
  const expenseBreakdown = getExpenseBreakdown(expenses);
  const productRows = getProductAnalytics(products);
  const inventoryRows = getInventoryAnalytics(products);

  // 🛡️ REFACTORING PENGAMAN DATA MENTAH
  const safeExpenses = Number(metrics?.totalExpenses) || 0;
  const safeProfit = Number(metrics?.totalProfit) || 0;

  const expenseRatio = safeProfit > 0 ? (safeExpenses / safeProfit) * 100 : 0;

  // 🛡️ TAMBAHAN PENGAMAN UNTUK RISK SCORE
  const safeRiskScore = metrics?.riskScore !== undefined 
    ? metrics.riskScore 
    : (metrics as any)?.risk_score !== undefined 
      ? (metrics as any).risk_score 
      : 0;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* SECTION HEADER LAPORAN */}
      <section style={{ ...cardStyle, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <Badge label="Reports Center" tone="success" />
          <h2 style={{ margin: "10px 0 4px" }}>
            {accountMode === "seller" ? "Laporan bisnis siap export" : "Laporan komisi affiliate"}
          </h2>
          <p style={{ color: "#64748b", margin: 0, lineHeight: 1.7 }}>
            {accountMode === "seller" 
              ? "Export cashflow, expenses, produk, dan laporan printable untuk disimpan sebagai PDF."
              : "Pantau performa tautan, taksiran komisi tertunda, dan riwayat klaim pencairan dana."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={onExportCSV} style={ghostButtonStyle}>Export CSV Bundle</button>
          <button onClick={onExportPDF} style={ctaButtonStyle}>Print / Save PDF</button>
        </div>
      </section>

      {/* SECTION 1: 4 KARTU METRIK ATAS */}
      {accountMode === "seller" ? (
        // 🏪 TAMPILAN MODE SELLER (ASLI)
        <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          <StatCard label="Cashflow bersih" value={money(metrics.netCash)} helper="Profit dikurangi expenses" tone={metrics.netCash >= 0 ? "success" : "danger"} />
          <StatCard label="Expense ratio" value={`${Math.round(expenseRatio)}%`} helper="Expenses dibanding profit produk" tone={expenseRatio > 45 ? "danger" : expenseRatio > 25 ? "warning" : "success"} />
          <StatCard label="Inventory value" value={compactMoney(metrics.inventoryValue)} helper="Modal masih berada di stok" tone="neutral" />
          <StatCard label="Risk score" value={`${safeRiskScore}/100`} helper="Profit, stok, expense, cashflow" tone={safeRiskScore >= 50 ? "danger" : safeRiskScore >= 25 ? "warning" : "success"} />
        </section>
      ) : (
        // 🔗 TAMPILAN MODE AFFILIATE (METRIK BARU)
        <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          <StatCard label="Total komisi cair" value={money(metrics.netCash)} helper="Sudah ditarik ke rekening" tone="success" />
          <StatCard label="Komisi tertunda (Pending)" value={money(metrics.totalProfit)} helper="Pesanan belum diselesaikan pembeli" tone="warning" />
          <StatCard label="Rasio konversi" value="8.5%" helper="Klik berbanding total pembelian" tone="success" />
          <StatCard label="Penjualan didukung (GMV)" value={compactMoney(metrics.totalRevenue)} helper="Total harga barang toko yang terjual" tone="neutral" />
        </section>
      )}

      {/* SECTION 2: GRAFIK & SUMMARY */}
      {accountMode === "seller" ? (
        // 🏪 DATA GRAFIK BULANAN UNTUK SELLER
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
      ) : (
        // 🔗 TABEL STRUKTUR TRANSPARAN TRANSAKSI UNTUK MODE AFFILIATE
        <section style={{ ...cardStyle, background: "#ffffff" }}>
          <Badge label="Affiliate Matrix" tone="blue" />
          <h3 style={{ margin: "12px 0 16px" }}>Rincian pendapatan per produk</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b" }}>
                  <th style={{ padding: "10px 8px" }}>Asal Toko</th>
                  <th style={{ padding: "10px 8px" }}>Nama Produk</th>
                  <th style={{ padding: "10px 8px" }}>Harga</th>
                  <th style={{ padding: "10px 8px" }}>Terjual</th>
                  <th style={{ padding: "10px 8px" }}>Skema Komisi</th>
                  <th style={{ padding: "10px 8px", color: "#10b981" }}>Komisi Anda</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 12 }}>🏪 Toko Am (TikTok)</td>
                  <td style={{ padding: 12, fontWeight: 500 }}>Produk A</td>
                  <td style={{ padding: 12 }}>Rp 1.000</td>
                  <td style={{ padding: 12 }}>1 Pcs</td>
                  <td style={{ padding: 12 }}><span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>10%</span></td>
                  <td style={{ padding: 12, fontWeight: 700, color: "#10b981" }}>Rp 100</td>
                </tr>
                <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 12 }}>🏪 Camou Official (Shopee)</td>
                  <td style={{ padding: 12, fontWeight: 500 }}>Sandal Camou Premium</td>
                  <td style={{ padding: 12 }}>Rp 150.000</td>
                  <td style={{ padding: 12 }}>3 Pcs</td>
                  <td style={{ padding: 12 }}><span style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>5%</span></td>
                  <td style={{ padding: 12, fontWeight: 700, color: "#10b981" }}>Rp 22.500</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 3: ANALYTICS TABLES BOTTOM (Hanya muncul jika mode seller aktif) */}
      {accountMode === "seller" && (
        <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <AnalyticsTable title="Profit Analytics" rows={productRows} />
          <AnalyticsTable title="Inventory Analytics" rows={inventoryRows} />
        </section>
      )}
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