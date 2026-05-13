import type { DashboardMetrics, Expense, Product } from "@/types/dashboard";
import { buildForecast, buildRecommendations, getForecastSummary, getMarketplaceStats } from "@/lib/dashboard/recommendations";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { cardStyle, Badge, Progress, StatCard, ctaButtonStyle, ghostButtonStyle } from "./ui";
import { ForecastChartCard, MarketplaceBarChart } from "./Charts";

const marketplaceGuides = [
  { name: "Shopee", status: "CSV ready", detail: "Import order CSV, fee admin, voucher seller, biaya iklan." },
  { name: "Tokopedia", status: "CSV ready", detail: "Import transaksi, biaya layanan, dan margin produk." },
  { name: "TikTok Shop", status: "Coming soon", detail: "Connector API disiapkan untuk Phase 3 automation." },
  { name: "Lazada", status: "Coming soon", detail: "Mapping CSV dan product sync disiapkan." },
];

export function AIRecommendationPanel({ products, expenses, metrics }: { products: Product[]; expenses: Expense[]; metrics: DashboardMetrics }) {
  const recommendations = buildRecommendations(products, expenses, metrics);
  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <Badge label="AI Recommendation Engine" tone="success" />
          <h2 style={{ margin: "10px 0 4px" }}>Rekomendasi otomatis yang actionable</h2>
          <p style={{ color: "#64748b", margin: 0, lineHeight: 1.7 }}>Rules engine membaca margin, stok, cashflow, expense ratio, dan performa marketplace tanpa menunggu user mengetik.</p>
        </div>
        <Badge label={`Risk ${metrics.riskScore}/100`} tone={metrics.riskScore >= 50 ? "danger" : metrics.riskScore >= 25 ? "warning" : "success"} />
      </div>
      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        {recommendations.map((item) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, padding: 16, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div>
              <Badge label={item.category.toUpperCase()} tone={item.severity} />
              <h3 style={{ margin: "10px 0 6px" }}>{item.title}</h3>
              <p style={{ color: "#475569", lineHeight: 1.65, margin: 0 }}>{item.message}</p>
              <p style={{ color: "#0f172a", lineHeight: 1.65, margin: "8px 0 0", fontWeight: 700 }}>{item.action}</p>
            </div>
            <div style={{ minWidth: 170, textAlign: "right", color: "#64748b", fontSize: 13 }}>{item.impact}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MarketplaceSyncPanel({ products }: { products: Product[] }) {
  const stats = getMarketplaceStats(products);
  const totalProfit = stats.reduce((acc, item) => acc + item.profit, 0);
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ ...cardStyle, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <Badge label="Marketplace Sync Center" tone="blue" />
          <h2 style={{ margin: "10px 0 4px" }}>Multi marketplace import & sync foundation</h2>
          <p style={{ color: "#64748b", margin: 0, lineHeight: 1.7 }}>Phase ini menyiapkan dashboard sync, mapping CSV, dan score tiap channel. API automation masuk Phase 3.</p>
        </div>
        <button style={ctaButtonStyle}>Import CSV Marketplace</button>
      </section>
      <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {marketplaceGuides.map((item) => (
          <div key={item.name} style={cardStyle}>
            <Badge label={item.status} tone={item.status.includes("ready") ? "success" : "muted"} />
            <h3 style={{ margin: "12px 0 6px" }}>{item.name}</h3>
            <p style={{ color: "#64748b", lineHeight: 1.6, margin: 0 }}>{item.detail}</p>
          </div>
        ))}
      </section>
      <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
        <MarketplaceBarChart title="Marketplace Profit" subtitle="Profit per channel" data={stats.map((item) => ({ label: item.marketplace, value: item.profit, secondary: item.revenue }))} />
        <div style={cardStyle}>
          <Badge label="Channel Analytics" tone="success" />
          <h3 style={{ margin: "12px 0" }}>Marketplace health</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {stats.map((item) => (
              <div key={item.marketplace} style={{ display: "grid", gap: 7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>{item.marketplace}</strong><span>{money(item.profit)}</span></div>
                <Progress value={totalProfit > 0 ? (item.profit / totalProfit) * 100 : 0} />
                <small style={{ color: "#64748b" }}>{item.units} unit · omzet {compactMoney(item.revenue)} · margin {percent(item.margin)}</small>
              </div>
            ))}
            {stats.length === 0 && <p style={{ color: "#64748b" }}>Belum ada data marketplace.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ForecastingPanel({ products, expenses, metrics }: { products: Product[]; expenses: Expense[]; metrics: DashboardMetrics }) {
  const forecast = buildForecast(products, expenses, 30);
  const summary = getForecastSummary(forecast);
  const breakEvenDay = forecast.findIndex((item, index) => forecast.slice(0, index + 1).reduce((acc, point) => acc + point.netCash, 0) > 0) + 1;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ ...cardStyle, display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <Badge label="AI Forecasting" tone="success" />
          <h2 style={{ margin: "10px 0 4px" }}>Prediksi cashflow, profit, dan risiko 30 hari</h2>
          <p style={{ color: "#64748b", margin: 0, lineHeight: 1.7 }}>Forecast berbasis sales velocity, margin, expense run-rate, dan inventory. Model ini rule-based agar murah dan stabil untuk MVP.</p>
        </div>
        <button style={ghostButtonStyle}>Export Forecast</button>
      </section>
      <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard label="Forecast omzet" value={compactMoney(summary.revenue)} helper="Proyeksi 30 hari" tone="blue" />
        <StatCard label="Forecast profit" value={compactMoney(summary.profit)} helper="Sebelum expense" tone="success" />
        <StatCard label="Forecast expense" value={compactMoney(summary.expenses)} helper="Run-rate 30 hari" tone="warning" />
        <StatCard label="Forecast net cash" value={compactMoney(summary.netCash)} helper={breakEvenDay > 0 ? `Break-even sekitar D+${breakEvenDay}` : "Perlu kontrol expense"} tone={summary.netCash >= 0 ? "success" : "danger"} />
      </section>
      <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
        <ForecastChartCard title="30-Day Forecast" subtitle="Revenue, profit, expenses" data={forecast} />
        <div style={cardStyle}>
          <Badge label="Forecast Decision" tone={summary.netCash >= 0 ? "success" : "danger"} />
          <h3 style={{ margin: "12px 0" }}>{summary.label}</h3>
          <p style={{ color: "#64748b", lineHeight: 1.7 }}>Dengan cashflow sekarang {money(metrics.netCash)}, sistem menyarankan scale hanya untuk produk margin sehat dan stok aman. Produk margin rendah sebaiknya ditahan dari restock sampai harga aman.</p>
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            <div><small>Profit forecast <b style={{ float: "right" }}>{compactMoney(summary.profit)}</b></small><Progress value={summary.revenue > 0 ? (summary.profit / summary.revenue) * 100 : 0} /></div>
            <div><small>Expense pressure <b style={{ float: "right" }}>{compactMoney(summary.expenses)}</b></small><Progress value={summary.profit > 0 ? (summary.expenses / summary.profit) * 100 : 0} /></div>
            <div><small>Net cash safety <b style={{ float: "right" }}>{compactMoney(summary.netCash)}</b></small><Progress value={summary.netCash > 0 && summary.profit > 0 ? (summary.netCash / summary.profit) * 100 : 0} /></div>
          </div>
        </div>
      </section>
    </div>
  );
}
