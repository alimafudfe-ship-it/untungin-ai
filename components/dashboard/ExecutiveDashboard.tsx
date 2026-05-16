import type React from "react";
import type { Product, DashboardMetrics, Tone } from "@/types/dashboard";
import { getOneThingAction } from "@/lib/dashboard/insights";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle, Progress, StatCard } from "./ui";
import { LineChartCard } from "./Charts";
import { ProductCards, ProductTable } from "./ProductTable";

type TrendPoint = { label: string; value: number; secondary?: number };

type ExecutiveDashboardProps = {
  products: Product[];
  metrics: DashboardMetrics;
  filteredProducts: Product[];
  cashflowTrend: TrendPoint[];
  profitTrend: TrendPoint[];
  isPro: boolean;
  isDemoMode: boolean;
  lastSync: string | null;
  onAddProduct: () => void;
  onAddCashflow: () => void;
  onImportCSV: (event: React.ChangeEvent<HTMLInputElement>) => void;
  syncing: boolean;
  onGoAI: () => void;
  onGoProducts: () => void;
  onGoMarketplace: () => void;
  onGoReports: () => void;
  onGoBilling: () => void;
  onStock: (id: string) => void;
  onSale: (id: string) => void;
  onDelete: (id: string) => void;
};

function getRiskTone(score: number): Tone {
  if (score >= 50) return "danger";
  if (score >= 25) return "warning";
  return "success";
}

function getCashRunway(metrics: DashboardMetrics) {
  if (metrics.dailyLeakEstimate <= 0) return "Aman";
  const days = Math.max(1, Math.floor(Math.max(metrics.netCash, 0) / metrics.dailyLeakEstimate));
  return `${days} hari`;
}

function healthLabel(score: number) {
  if (score >= 82) return "Excellent";
  if (score >= 65) return "Healthy";
  if (score >= 45) return "Watch";
  return "At risk";
}

export function ExecutiveDashboard({ products, metrics, filteredProducts, cashflowTrend, profitTrend, isPro, isDemoMode, lastSync, onAddProduct, onAddCashflow, onImportCSV, syncing, onGoAI, onGoProducts, onGoMarketplace, onGoReports, onGoBilling, onStock, onSale, onDelete }: ExecutiveDashboardProps) {
  const topProducts = [...products].sort((a, b) => b.profit - a.profit).slice(0, 4);
  const criticalProducts = products.filter((item) => item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15).slice(0, 4);
  const lossProducts = products.filter((item) => item.profit < 0).slice(0, 4);
  const riskTone = getRiskTone(metrics.riskScore);
  const operatingScore = Math.max(0, Math.min(100, 100 - metrics.riskScore));
  const lastSyncText = lastSync ? new Date(lastSync).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Belum sinkron";
  const planLabel = isDemoMode ? "Demo workspace" : isPro ? "PRO workspace" : "Free workspace";
  const actionText = getOneThingAction(products);

  return <div style={{ display: "grid", gap: 18 }}>
    <section className="command-grid" style={{ display: "grid", gridTemplateColumns: "1.45fr 0.55fr", gap: 18 }}>
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 28px 90px rgba(15,23,42,0.22)" }}>
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1.12fr 0.88fr", gap: 22, padding: 26, position: "relative" }}>
          <div style={{ position: "absolute", right: -120, top: -150, width: 420, height: 420, borderRadius: 999, background: "radial-gradient(circle,#14b8a6 0%,rgba(20,184,166,0.18) 42%,rgba(20,184,166,0) 70%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Badge label="Seller OS" tone="success" />
              <span style={{ color: "#cbd5e1", fontSize: 13 }}>{planLabel}</span>
            </div>
            <h1 className="hero-title" style={{ margin: "14px 0 10px", fontSize: 42, lineHeight: 1.04, letterSpacing: -1.7, maxWidth: 780 }}>Kelola profit, stok, dan cashflow seperti perusahaan profesional.</h1>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: 15, lineHeight: 1.75, maxWidth: 760 }}>Command center untuk seller marketplace Indonesia: KPI penting, risiko operasional, ranking SKU, dan rekomendasi tindakan harian dalam satu layar.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
              <button onClick={onAddProduct} style={{ ...ctaButtonStyle, background: "linear-gradient(135deg,#ffffff,#ccfbf1)", color: "#0f172a", boxShadow: "0 18px 40px rgba(255,255,255,0.12)" }}>Tambah produk</button>
              <button onClick={onAddCashflow} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.18)", boxShadow: "none" }}>Catat cashflow</button>
              <label style={{ ...ghostButtonStyle, display: "inline-flex", cursor: "pointer", background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.18)", boxShadow: "none" }}>{syncing ? "Importing..." : "Import CSV"}<input type="file" accept=".csv" onChange={onImportCSV} style={{ display: "none" }} /></label>
            </div>
            <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10, marginTop: 20 }}>
              <MiniMetric label="Operating score" value={`${operatingScore}/100`} helper={healthLabel(operatingScore)} />
              <MiniMetric label="Cash runway" value={getCashRunway(metrics)} helper="Based on leakage" />
              <MiniMetric label="Last sync" value={lastSyncText} helper="Marketplace data" />
            </div>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 12 }}>
            <div style={{ padding: 20, borderRadius: 24, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.16)", backdropFilter: "blur(16px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}><span style={{ color: "#cbd5e1" }}>Net cash position</span><Badge label={metrics.netCash >= 0 ? "Healthy" : "Needs action"} tone={metrics.netCash >= 0 ? "success" : "danger"} /></div>
              <h2 style={{ margin: "8px 0 14px", fontSize: 37, letterSpacing: -1.2 }}>{money(metrics.netCash)}</h2>
              <div style={{ display: "grid", gap: 10 }}>
                <HealthRow label="Profit to inventory" value={Math.min(100, (metrics.totalProfit / Math.max(metrics.inventoryValue, 1)) * 100)} right={compactMoney(metrics.totalProfit)} />
                <HealthRow label="Expense pressure" value={Math.min(100, (metrics.totalExpenses / Math.max(metrics.totalProfit, 1)) * 100)} right={compactMoney(metrics.totalExpenses)} />
                <HealthRow label="Risk control" value={Math.max(0, 100 - metrics.riskScore)} right={`${metrics.riskScore}/100`} />
              </div>
            </div>
            <div style={{ padding: 17, borderRadius: 22, background: "rgba(255,255,255,0.94)", color: "#111827", border: "1px solid rgba(255,255,255,0.20)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}><strong>AI daily decision</strong><Badge label="Today" tone="blue" /></div>
              <p style={{ margin: "8px 0 12px", color: "#667085", lineHeight: 1.6, fontSize: 14 }}>{actionText}</p>
              <button onClick={onGoAI} style={{ ...ghostButtonStyle, padding: "9px 12px" }}>Buka action plan</button>
            </div>
          </div>
        </div>
      </div>

      <aside style={{ ...cardStyle, display: "grid", gap: 16, alignContent: "start" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><Badge label="Board brief" tone="blue" /><span style={{ color: "#667085", fontSize: 12 }}>Today</span></div>
        <BriefRow label="Revenue" value={money(metrics.totalRevenue)} helper={`${metrics.totalUnits} unit sold`} />
        <BriefRow label="Gross profit" value={money(metrics.totalProfit)} helper={`${percent(metrics.avgMargin)} avg margin`} />
        <BriefRow label="Inventory value" value={money(metrics.inventoryValue)} helper={`${metrics.totalStock} units available`} />
        <div style={{ padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>PRO readiness</strong><span style={{ color: "#0f766e", fontWeight: 900 }}>{isPro ? "Active" : "62%"}</span></div>
          <div style={{ margin: "12px 0" }}><Progress value={isPro ? 100 : 62} /></div>
          <p style={{ margin: 0, color: "#667085", fontSize: 13, lineHeight: 1.55 }}>{isPro ? "AI CFO, reports, and workspace features are unlocked." : "Lengkapi import data, aktifkan report, lalu upgrade saat siap scale."}</p>
        </div>
      </aside>
    </section>

    <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
      <StatCard label="Omzet" value={money(metrics.totalRevenue)} helper={`${metrics.totalUnits} unit terjual`} tone="blue" />
      <StatCard label="Profit produk" value={money(metrics.totalProfit)} helper={`Margin rata-rata ${percent(metrics.avgMargin)}`} tone={metrics.totalProfit >= 0 ? "success" : "danger"} />
      <StatCard label="Stok kritis" value={metrics.lowStockCount + metrics.outOfStockCount} helper={`${metrics.totalStock} unit tersedia`} tone={metrics.lowStockCount + metrics.outOfStockCount ? "warning" : "success"} />
      <StatCard label="Risk score" value={`${metrics.riskScore}/100`} helper={`Estimasi bocor ${money(metrics.dailyLeakEstimate)} per hari`} tone={riskTone} />
    </section>

    <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 18 }}>
      <div style={{ display: "grid", gap: 18 }}>
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <LineChartCard title="Cashflow trend" subtitle="Cash in vs cash out" data={cashflowTrend} valueLabel="Cash in" secondaryLabel="Cash out" />
          <LineChartCard title="Profit trend" subtitle="Estimasi profit 7 hari" data={profitTrend} valueLabel="Profit" />
        </div>
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <div><Badge label="SKU performance" tone="blue" /><h2 style={{ margin: "8px 0 0", letterSpacing: -0.5 }}>Priority products</h2></div>
            <button onClick={onGoProducts} style={ghostButtonStyle}>Kelola produk</button>
          </div>
          <div className="desktop-table"><ProductTable products={filteredProducts.slice(0, 6)} onStock={onStock} onSale={onSale} onDelete={onDelete} /></div>
          <ProductCards products={filteredProducts.slice(0, 4)} onStock={onStock} onSale={onSale} />
        </section>
      </div>

      <aside style={{ display: "grid", gap: 18 }}>
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><Badge label="Next best actions" tone="success" /><button onClick={onGoAI} style={{ ...ghostButtonStyle, padding: "8px 11px" }}>AI detail</button></div>
          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            <ActionItem index="01" title="Review SKU margin rendah" detail={`${lossProducts.length} produk rugi terdeteksi. Cek HPP, voucher, fee admin, dan harga jual.`} cta="Lihat produk" onClick={onGoProducts} />
            <ActionItem index="02" title="Amankan stok cepat habis" detail={`${criticalProducts.length} SKU perlu restock atau monitoring supaya tidak kehilangan penjualan.`} cta="Inventory" onClick={onGoProducts} />
            <ActionItem index="03" title="Kirim laporan mingguan" detail="Export PDF/CSV untuk owner, investor kecil, atau partner operasional." cta="Reports" onClick={onGoReports} />
          </div>
        </section>

        <section style={cardStyle}>
          <Badge label="Top performers" tone="blue" />
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {topProducts.length ? topProducts.map((product, index) => <div key={product.id} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", gap: 10, alignItems: "center", padding: 12, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <strong style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", background: "#ecfdf5", color: "#047857" }}>{index + 1}</strong>
              <div><strong>{product.name}</strong><div style={{ color: "#64748b", fontSize: 12 }}>{product.marketplace || "Marketplace"} - margin {percent(product.margin)}</div></div>
              <strong style={{ color: product.profit >= 0 ? "#047857" : "#b42318" }}>{compactMoney(product.profit)}</strong>
            </div>) : <p style={{ color: "#64748b", lineHeight: 1.65 }}>Tambahkan produk atau import CSV untuk melihat ranking profit.</p>}
          </div>
        </section>

        <section style={{ ...cardStyle, background: "linear-gradient(135deg,#ecfdf5,#ffffff)" }}>
          <Badge label="Scale setup" tone="warning" />
          <h3 style={{ margin: "12px 0 8px", letterSpacing: -0.3 }}>Upgrade dari catatan manual ke operating system</h3>
          <p style={{ color: "#64748b", lineHeight: 1.65, marginTop: 0 }}>Hubungkan data marketplace, aktifkan AI CFO, lalu jadikan report otomatis sebagai rutinitas bisnis.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={onGoMarketplace} style={ghostButtonStyle}>Integrasi</button>
            <button onClick={onGoBilling} style={ctaButtonStyle}>Lihat PRO</button>
          </div>
        </section>
      </aside>
    </section>
  </div>;
}

function MiniMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div style={{ padding: 13, borderRadius: 18, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}><small style={{ color: "#cbd5e1" }}>{label}</small><br /><strong style={{ display: "block", marginTop: 4, color: "white" }}>{value}</strong><small style={{ color: "#94a3b8" }}>{helper}</small></div>;
}

function HealthRow({ label, value, right }: { label: string; value: number; right: string }) {
  return <div><div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#cbd5e1", fontSize: 13, marginBottom: 7 }}><span>{label}</span><strong style={{ color: "white" }}>{right}</strong></div><Progress value={value} /></div>;
}

function BriefRow({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div style={{ paddingBottom: 14, borderBottom: "1px solid #e5e7eb" }}><div style={{ color: "#667085", fontSize: 12, fontWeight: 800 }}>{label}</div><strong style={{ display: "block", marginTop: 5, fontSize: 24, letterSpacing: -0.7 }}>{value}</strong><small style={{ color: "#667085" }}>{helper}</small></div>;
}

function ActionItem({ index, title, detail, cta, onClick }: { index: string; title: string; detail: string; cta: string; onClick: () => void }) {
  return <div style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 12, padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
    <strong style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", background: "#0f172a", color: "white", fontSize: 12 }}>{index}</strong>
    <div><strong>{title}</strong><p style={{ margin: "6px 0 12px", color: "#64748b", lineHeight: 1.55, fontSize: 13 }}>{detail}</p><button onClick={onClick} style={{ ...ghostButtonStyle, padding: "8px 11px" }}>{cta}</button></div>
  </div>;
}
