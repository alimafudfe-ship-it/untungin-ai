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
  if (score >= 82) return "Sangat baik";
  if (score >= 65) return "Sehat";
  if (score >= 45) return "Pantau";
  return "Berisiko";
}

function getDelta(current: number, previous: number): { text: string; tone: Tone } {
  if (!previous) return { text: "Baru", tone: "muted" };
  const pct = ((current - previous) / Math.abs(previous || 1)) * 100;
  if (Math.abs(pct) < 1) return { text: "Stabil", tone: "muted" };
  const rounded = Math.round(Math.abs(pct) * 10) / 10;
  return pct >= 0
    ? { text: `↑ ${rounded}%`, tone: "success" }
    : { text: `↓ ${rounded}%`, tone: "danger" };
}

export function ExecutiveDashboard({
  products,
  metrics,
  filteredProducts,
  cashflowTrend,
  profitTrend,
  isPro,
  isDemoMode,
  lastSync,
  onAddProduct,
  onAddCashflow,
  onImportCSV,
  syncing,
  onGoAI,
  onGoProducts,
  onGoMarketplace,
  onGoReports,
  onGoBilling,
  onStock,
  onSale,
  onDelete,
}: ExecutiveDashboardProps) {
  const topProducts = [...products].sort((a, b) => b.profit - a.profit).slice(0, 4);
  const criticalProducts = products.filter((item) => item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15);
  const criticalPreview = criticalProducts.slice(0, 4);
  const lossProducts = products.filter((item) => item.profit < 0);
  const lossPreview = lossProducts.slice(0, 4);
  const riskTone = getRiskTone(metrics.riskScore);
  const operatingScore = Math.max(0, Math.min(100, 100 - metrics.riskScore));
  const lastSyncText = lastSync ? new Date(lastSync).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Belum sinkron";
  const planLabel = isDemoMode ? "Ruang kerja demo" : isPro ? "Ruang kerja PRO" : "Ruang kerja gratis";
  const actionText = getOneThingAction(products);
  const revenueNow = cashflowTrend[cashflowTrend.length - 1]?.value || 0;
  const revenuePrev = cashflowTrend[cashflowTrend.length - 2]?.value || 0;
  const profitNow = profitTrend[profitTrend.length - 1]?.value || 0;
  const profitPrev = profitTrend[profitTrend.length - 2]?.value || 0;
  const revenueDelta = getDelta(revenueNow, revenuePrev);
  const profitDelta = getDelta(profitNow, profitPrev);
  const lowStockCount = metrics.lowStockCount + metrics.outOfStockCount;
  const inventoryDelta = lowStockCount > 0 ? { text: `${lowStockCount} mendesak`, tone: "warning" as Tone } : { text: "Terkendali", tone: "success" as Tone };
  const riskDelta = metrics.riskScore <= 15 ? { text: "Stabil", tone: "success" as Tone } : metrics.riskScore <= 35 ? { text: "Pantau", tone: "warning" as Tone } : { text: "Tinggi", tone: "danger" as Tone };

  const checklist = [
    { label: "Tambahkan minimal 3 produk inti", done: products.length >= 3 },
    { label: "Catat arus kas atau biaya operasional", done: metrics.totalExpenses > 0 || metrics.totalRevenue > 0 },
    { label: "Sinkronkan marketplace atau impor CSV", done: Boolean(lastSync) || products.some((item) => Boolean(item.marketplace)) },
    { label: "Aktifkan AI report rutin / PRO", done: isPro },
  ];
  const checklistSelesai = checklist.filter((item) => item.done).length;
  const checklistProgress = Math.round((checklistSelesai / checklist.length) * 100);

  const activityItems = [
    {
      title: lowStockCount > 0 ? `${lowStockCount} SKU perlu perhatian stok` : "Stok inti terkendali",
      detail: lowStockCount > 0 ? `Prioritaskan isi ulang stok untuk ${criticalPreview[0]?.name || "produk utama"}.` : "Belum ada produk yang masuk status kritis.",
      time: "Baru saja",
    },
    {
      title: lastSync ? "Marketplace terakhir tersinkron" : "Belum ada sinkronisasi marketplace",
      detail: lastSync ? `Update terakhir ${lastSyncText}.` : "Impor CSV atau hubungkan channel agar data lebih akurat.",
      time: "Hari ini",
    },
    {
      title: lossProducts.length > 0 ? `${lossProducts.length} produk margin perlu ditinjau` : "Margin produk aman",
      detail: lossProducts.length > 0 ? `Mulai dari ${lossPreview[0]?.name || "SKU prioritas"} untuk evaluasi HPP dan fee.` : "Fokus berikutnya: kembangkan produk dengan margin tertinggi.",
      time: "Insight AI",
    },
  ];

  return <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
    <style>{`
      .overview-grid,
      .hero-layout,
      .metrics-grid,
      .dashboard-grid,
      .chart-grid,
      .right-stack,
      .status-mini-grid,
      .kpi-status-grid,
      .command-side,
      .feed-grid {
        min-width: 0;
      }
      .overview-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.42fr) minmax(300px, 0.58fr);
        gap: 12px;
        align-items: start;
      }
      .hero-layout {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
        gap: 12px;
        padding: 16px;
        position: relative;
      }
      .hero-copy {
        position: relative;
        z-index: 1;
        min-width: 0;
      }
      .hero-title {
        margin: 8px 0 6px;
        font-size: clamp(25px, 2.55vw, 36px);
        line-height: 1.03;
        letter-spacing: -1.15px;
        max-width: 720px;
      }
      .hero-subtitle {
        margin: 0;
        color: #cbd5e1;
        font-size: 12px;
        line-height: 1.58;
        max-width: 720px;
      }
      .command-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px; }
      .hero-fill-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 12px; }
      .hero-fill-card { padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.13); min-width: 0; }
      .hero-fill-card strong { display: block; color: white; font-size: 13px; margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .hero-fill-card small { color: #94a3b8; font-size: 11px; line-height: 1.45; }
      .status-mini-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }
      .command-side {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 10px;
        min-width: 0;
      }
      .kpi-status-grid {
        display: grid;
        gap: 10px;
      }
      .compact-panel {
        padding: 14px;
        border-radius: 20px;
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(255,255,255,0.16);
        backdrop-filter: blur(16px);
      }
      .board-stack {
        display: grid;
        gap: 12px;
        align-content: start;
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .dashboard-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
        gap: 12px;
      }
      .chart-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .right-stack {
        display: grid;
        gap: 12px;
      }
      .checklist-row {
        display: grid;
        grid-template-columns: 22px 1fr auto;
        align-items: center;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid #edf2f7;
      }
      .activity-row {
        display: grid;
        grid-template-columns: 10px 1fr auto;
        gap: 10px;
        align-items: start;
        padding: 12px 0;
        border-bottom: 1px solid #edf2f7;
      }
      .activity-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: linear-gradient(135deg, #0f766e, #14b8a6);
        margin-top: 6px;
      }
      .top-performer-row {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        padding: 12px;
        border-radius: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }
      @media (max-width: 1280px) {
        .overview-grid, .dashboard-grid { grid-template-columns: 1fr; }
        .hero-layout { grid-template-columns: 1fr; }
        .status-mini-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .hero-fill-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      }
      @media (max-width: 980px) {
        .metrics-grid, .chart-grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 720px) {
        .hero-layout { padding: 14px; }
        .command-actions { display: grid; grid-template-columns: 1fr; }
        .command-actions > * { width: 100%; justify-content: center; text-align: center; }
        .status-mini-grid, .metrics-grid, .chart-grid, .hero-fill-grid { grid-template-columns: 1fr; }
        .top-performer-row { grid-template-columns: 30px minmax(0, 1fr); }
        .top-performer-row > :last-child { grid-column: 2; }
      }
    `}</style>

    <section className="overview-grid">
      <div style={{ ...cardStyle, padding: 0, overflow: "hidden", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 28px 90px rgba(15,23,42,0.22)" }}>
        <div className="hero-layout">
          <div style={{ position: "absolute", right: -120, top: -150, width: 420, height: 420, borderRadius: 999, background: "radial-gradient(circle,#14b8a6 0%,rgba(20,184,166,0.18) 42%,rgba(20,184,166,0) 70%)" }} />
          <div className="hero-copy">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Badge label="Seller OS" tone="success" />
              <span style={{ color: "#cbd5e1", fontSize: 12 }}>{planLabel}</span>
            </div>
            <h1 className="hero-title">Kelola profit, stok, dan arus kas dalam satu pusat kontrol premium.</h1>
            <p className="hero-subtitle">Pantau KPI, risiko stok, performa SKU, dan aksi AI harian tanpa berpindah halaman.</p>
            <div className="command-actions">
              <button onClick={onAddProduct} style={{ ...ctaButtonStyle, background: "linear-gradient(135deg,#ffffff,#ccfbf1)", color: "#0f172a", boxShadow: "0 18px 40px rgba(255,255,255,0.12)" }}>Tambah produk</button>
              <button onClick={onAddCashflow} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.18)", boxShadow: "none" }}>Catat arus kas</button>
              <label style={{ ...ghostButtonStyle, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.18)", boxShadow: "none" }}>{syncing ? "Mengimpor..." : "Impor CSV"}<input type="file" accept=".csv" onChange={onImportCSV} style={{ display: "none" }} /></label>
            </div>
            <div className="status-mini-grid">
              <MiniMetric label="Skor operasi" value={`${operatingScore}/100`} helper={healthLabel(operatingScore)} />
              <MiniMetric label="Runway kas" value={getCashRunway(metrics)} helper="Estimasi daya tahan kas" />
              <MiniMetric label="Sinkron marketplace" value={lastSync ? "Terhubung" : "Menunggu"} helper={lastSyncText} />
              <MiniMetric label="Prioritas AI" value={lossProducts.length ? `${lossProducts.length} perlu ditinjau` : "Siap tumbuh"} helper="Fokus harian" />
            </div>
            <div className="hero-fill-grid">
              <HeroFillCard label="Fokus hari ini" value={lowStockCount > 0 ? `${lowStockCount} stok perlu dicek` : "Operasi aman"} helper={lowStockCount > 0 ? "Mulai dari produk paling laris." : "Siap dorong penjualan."} />
              <HeroFillCard label="Produk unggulan" value={topProducts[0]?.name || "Belum ada produk"} helper={topProducts[0] ? `${compactMoney(topProducts[0].profit)} profit tercatat` : "Tambah produk untuk ranking."} />
              <HeroFillCard label="Ritme kerja" value="Cek profit → stok → aksi" helper="Alur harian untuk seller." />
            </div>
          </div>

          <div className="command-side">
            <div className="compact-panel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}><span style={{ color: "#cbd5e1" }}>Posisi kas bersih</span><Badge label={metrics.netCash >= 0 ? "Sehat" : "Perlu aksi"} tone={metrics.netCash >= 0 ? "success" : "danger"} /></div>
              <h2 style={{ margin: "8px 0 14px", fontSize: 30, letterSpacing: -1.1 }}>{money(metrics.netCash)}</h2>
              <div className="kpi-status-grid">
                <HealthRow label="Profit ke stok" value={Math.min(100, (metrics.totalProfit / Math.max(metrics.inventoryValue, 1)) * 100)} right={compactMoney(metrics.totalProfit)} />
                <HealthRow label="Tekanan biaya" value={Math.min(100, (metrics.totalExpenses / Math.max(metrics.totalProfit, 1)) * 100)} right={compactMoney(metrics.totalExpenses)} />
                <HealthRow label="Kontrol risiko" value={Math.max(0, 100 - metrics.riskScore)} right={`${metrics.riskScore}/100`} />
              </div>
            </div>
            <div style={{ padding: 17, borderRadius: 22, background: "rgba(255,255,255,0.94)", color: "#111827", border: "1px solid rgba(255,255,255,0.20)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}><strong>Keputusan AI hari ini</strong><Badge label="Hari ini" tone="blue" /></div>
              <p style={{ margin: "8px 0 12px", color: "#667085", lineHeight: 1.6, fontSize: 14 }}>{actionText}</p>
              <button onClick={onGoAI} style={{ ...ghostButtonStyle, padding: "9px 12px" }}>Buka rencana aksi</button>
            </div>
          </div>
        </div>
      </div>

      <aside className="board-stack">
        <section style={{ ...cardStyle, display: "grid", gap: 16, alignContent: "start" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><Badge label="Ringkasan bisnis" tone="blue" /><span style={{ color: "#667085", fontSize: 12 }}>Hari ini</span></div>
          <BriefRow label="Omzet" value={money(metrics.totalRevenue)} helper={`${metrics.totalUnits} unit terjual`} />
          <BriefRow label="Profit kotor" value={money(metrics.totalProfit)} helper={`${percent(metrics.avgMargin)} margin rata-rata`} />
          <BriefRow label="Nilai stok" value={money(metrics.inventoryValue)} helper={`${metrics.totalStock} unit tersedia`} />
          <div style={{ padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>Kesiapan PRO</strong><span style={{ color: "#0f766e", fontWeight: 900 }}>{isPro ? "Aktif" : `${Math.max(62, checklistProgress)}%`}</span></div>
            <div style={{ margin: "10px 0" }}><Progress value={isPro ? 100 : Math.max(62, checklistProgress)} /></div>
            <p style={{ margin: 0, color: "#667085", fontSize: 12, lineHeight: 1.55 }}>{isPro ? "AI CFO, laporan, dan fitur ruang kerja sudah aktif." : "Lengkapi impor data, aktifkan alur kerja inti, lalu upgrade saat siap tumbuh."}</p>
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <Badge label="Onboarding & status" tone="success" />
              <h3 style={{ margin: "10px 0 0", letterSpacing: -0.4 }}>Kesiapan operasional</h3>
            </div>
            <strong style={{ color: "#0f766e" }}>{checklistProgress}%</strong>
          </div>
          <div style={{ marginTop: 10 }}><Progress value={checklistProgress} /></div>
          <div style={{ display: "grid", gap: 2, marginTop: 10 }}>
            {checklist.map((item) => <div key={item.label} className="checklist-row">
              <span style={{ width: 22, height: 22, borderRadius: 999, display: "grid", placeItems: "center", background: item.done ? "#ecfdf5" : "#f8fafc", color: item.done ? "#047857" : "#98a2b3", border: `1px solid ${item.done ? "#a7f3d0" : "#e2e8f0"}`, fontSize: 12, fontWeight: 900 }}>{item.done ? "✓" : "•"}</span>
              <span style={{ color: item.done ? "#111827" : "#667085", fontSize: 12 }}>{item.label}</span>
              <span style={{ color: item.done ? "#047857" : "#98a2b3", fontSize: 12, fontWeight: 800 }}>{item.done ? "Selesai" : "Belum"}</span>
            </div>)}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button onClick={onGoMarketplace} style={ghostButtonStyle}>Hubungkan data</button>
            {!isPro && <button onClick={onGoBilling} style={ctaButtonStyle}>Aktifkan PRO</button>}
          </div>
        </section>
      </aside>
    </section>

    <section className="metrics-grid">
      <StatCard label="Omzet" value={money(metrics.totalRevenue)} helper={`${metrics.totalUnits} unit terjual`} tone="blue" delta={revenueDelta.text} deltaTone={revenueDelta.tone} />
      <StatCard label="Profit produk" value={money(metrics.totalProfit)} helper={`Margin rata-rata ${percent(metrics.avgMargin)}`} tone={metrics.totalProfit >= 0 ? "success" : "danger"} delta={profitDelta.text} deltaTone={profitDelta.tone} />
      <StatCard label="Stok kritis" value={lowStockCount} helper={`${metrics.totalStock} unit tersedia`} tone={lowStockCount ? "warning" : "success"} delta={inventoryDelta.text} deltaTone={inventoryDelta.tone} />
      <StatCard label="Skor risiko" value={`${metrics.riskScore}/100`} helper={`Estimasi bocor ${money(metrics.dailyLeakEstimate)} per hari`} tone={riskTone} delta={riskDelta.text} deltaTone={riskDelta.tone} />
    </section>

    <section className="dashboard-grid">
      <div style={{ display: "grid", gap: 18, minWidth: 0 }}>
        <div className="chart-grid">
          <LineChartCard title="Tren arus kas" subtitle="Kas masuk vs keluar" data={cashflowTrend} valueLabel="Kas masuk" secondaryLabel="Kas keluar" />
          <LineChartCard title="Tren profit" subtitle="Estimasi profit 7 hari" data={profitTrend} valueLabel="Profit" />
        </div>
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <div><Badge label="Performa SKU" tone="blue" /><h2 style={{ margin: "8px 0 0", letterSpacing: -0.5 }}>Produk prioritas</h2></div>
            <button onClick={onGoProducts} style={ghostButtonStyle}>Kelola produk</button>
          </div>
          <div className="desktop-table"><ProductTable products={filteredProducts.slice(0, 6)} onStock={onStock} onSale={onSale} onDelete={onDelete} /></div>
          <ProductCards products={filteredProducts.slice(0, 4)} onStock={onStock} onSale={onSale} />
        </section>
      </div>

      <aside className="right-stack">
        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}><Badge label="Aksi terbaik berikutnya" tone="success" /><button onClick={onGoAI} style={{ ...ghostButtonStyle, padding: "8px 11px" }}>Detail AI</button></div>
          <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
            <ActionItem index="01" title="Tinjau SKU margin rendah" detail={`${lossProducts.length} produk rugi terdeteksi. Cek HPP, voucher, fee admin, dan harga jual.`} cta="Lihat produk" onClick={onGoProducts} />
            <ActionItem index="02" title="Amankan stok cepat habis" detail={`${criticalProducts.length} SKU perlu isi ulang stok atau dipantau agar tidak kehilangan penjualan.`} cta="Stok" onClick={onGoProducts} />
            <ActionItem index="03" title="Kirim laporan mingguan" detail="Ekspor PDF/CSV untuk pemilik, mitra, atau arsip operasional." cta="Laporan" onClick={onGoReports} />
          </div>
        </section>

        <section style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}><Badge label="Aktivitas terbaru" tone="neutral" /><button onClick={onGoMarketplace} style={{ ...ghostButtonStyle, padding: "8px 11px" }}>Status data</button></div>
          <div style={{ display: "grid", marginTop: 10 }}>
            {activityItems.map((item) => <div key={item.title} className="activity-row">
              <span className="activity-dot" />
              <div><strong>{item.title}</strong><div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.55, marginTop: 4 }}>{item.detail}</div></div>
              <span style={{ color: "#98a2b3", fontSize: 12, fontWeight: 800 }}>{item.time}</span>
            </div>)}
          </div>
        </section>

        <section style={cardStyle}>
          <Badge label="Produk terbaik" tone="blue" />
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            {topProducts.length ? topProducts.map((product, index) => <div key={product.id} className="top-performer-row">
              <strong style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", background: "#ecfdf5", color: "#047857" }}>{index + 1}</strong>
              <div style={{ minWidth: 0 }}><strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</strong><div style={{ color: "#64748b", fontSize: 12 }}>{product.marketplace || "Marketplace"} · margin {percent(product.margin)}</div></div>
              <strong style={{ color: product.profit >= 0 ? "#047857" : "#b42318" }}>{compactMoney(product.profit)}</strong>
            </div>) : <p style={{ color: "#64748b", lineHeight: 1.65 }}>Tambahkan produk atau impor CSV untuk melihat peringkat profit.</p>}
          </div>
        </section>

        <section style={{ ...cardStyle, background: "linear-gradient(135deg,#ecfdf5,#ffffff)" }}>
          <Badge label="Setup Tumbuh" tone="warning" />
          <h3 style={{ margin: "12px 0 8px", letterSpacing: -0.3 }}>Naikkan level dari pencatatan manual ke alur kerja SaaS</h3>
          <p style={{ color: "#64748b", lineHeight: 1.65, marginTop: 0 }}>Hubungkan data marketplace, aktifkan AI CFO, dan jadikan laporan otomatis sebagai ritme operasional harian.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={onGoMarketplace} style={ghostButtonStyle}>Integrasi</button>
            <button onClick={onGoBilling} style={ctaButtonStyle}>{isPro ? "Kelola paket" : "Lihat PRO"}</button>
          </div>
        </section>
      </aside>
    </section>
  </div>;
}

function HeroFillCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div className="hero-fill-card"><small>{label}</small><strong>{value}</strong><small>{helper}</small></div>;
}

function MiniMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div style={{ padding: 10, borderRadius: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", minWidth: 0 }}><small style={{ color: "#cbd5e1" }}>{label}</small><br /><strong style={{ display: "block", marginTop: 4, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</strong><small style={{ color: "#94a3b8" }}>{helper}</small></div>;
}

function HealthRow({ label, value, right }: { label: string; value: number; right: string }) {
  return <div><div style={{ display: "flex", justifyContent: "space-between", gap: 10, color: "#cbd5e1", fontSize: 12, marginBottom: 7 }}><span>{label}</span><strong style={{ color: "white" }}>{right}</strong></div><Progress value={value} /></div>;
}

function BriefRow({ label, value, helper }: { label: string; value: string; helper: string }) {
  return <div style={{ paddingBottom: 10, borderBottom: "1px solid #e5e7eb" }}><div style={{ color: "#667085", fontSize: 12, fontWeight: 800 }}>{label}</div><strong style={{ display: "block", marginTop: 5, fontSize: 21, letterSpacing: -0.7 }}>{value}</strong><small style={{ color: "#667085" }}>{helper}</small></div>;
}

function ActionItem({ index, title, detail, cta, onClick }: { index: string; title: string; detail: string; cta: string; onClick: () => void }) {
  return <div style={{ display: "grid", gridTemplateColumns: "34px 1fr", gap: 12, padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
    <strong style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", background: "#0f172a", color: "white", fontSize: 12 }}>{index}</strong>
    <div><strong>{title}</strong><p style={{ margin: "6px 0 12px", color: "#64748b", lineHeight: 1.55, fontSize: 12 }}>{detail}</p><button onClick={onClick} style={{ ...ghostButtonStyle, padding: "8px 11px" }}>{cta}</button></div>
  </div>;
}
