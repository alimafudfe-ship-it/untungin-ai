import type React from "react";
import type { DashboardMetrics, Product } from "@/types/dashboard";
import type { Store } from "@/lib/saas/workspace";
import { money, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle, Progress } from "@/components/dashboard/ui";

type Props = {
  products: Product[];
  metrics: DashboardMetrics;
  stores: Store[];
  workspaceId: string | null;
  userEmail: string | null;
  isDemoMode: boolean;
  syncing: boolean;
  lastSync: string | null;
  onImportCSV: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onGoMarketplace: () => void;
  onGoProducts: () => void;
  onGoAI: () => void;
  onGoBilling: () => void;
};

function Step({ number, title, description, done }: { number: number; title: string; description: string; done: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "38px 1fr", gap: 12, alignItems: "start", padding: 14, borderRadius: 18, background: done ? "#ecfdf5" : "#f8fafc", border: done ? "1px solid #99f6e4" : "1px solid #e2e8f0" }}>
      <div style={{ width: 38, height: 38, borderRadius: 14, display: "grid", placeItems: "center", fontWeight: 950, color: done ? "#047857" : "#475569", background: done ? "#d1fae5" : "#ffffff", border: "1px solid rgba(16,24,40,0.08)" }}>{done ? "✓" : number}</div>
      <div>
        <strong>{title}</strong>
        <p style={{ color: "#64748b", margin: "5px 0 0", lineHeight: 1.55, fontSize: 13 }}>{description}</p>
      </div>
    </div>
  );
}

export function FirstCustomerReadyPanel({ products, metrics, stores, workspaceId, userEmail, isDemoMode, syncing, lastSync, onImportCSV, onGoMarketplace, onGoProducts, onGoAI, onGoBilling }: Props) {
  const hasStore = stores.length > 0;
  const hasData = products.length > 0;
  const hasInsight = hasData && (metrics.totalRevenue > 0 || metrics.totalProfit !== 0 || metrics.lowStockCount > 0 || metrics.riskScore > 0);
  const activationScore = Math.min(100, (workspaceId ? 20 : 0) + (hasStore ? 20 : 0) + (hasData ? 30 : 0) + (hasInsight ? 20 : 0) + (lastSync ? 10 : 0));
  const topProduct = [...products].sort((a, b) => b.profit - a.profit)[0];

  return (
    <section style={{ ...cardStyle, padding: 0, overflow: "hidden", border: hasData ? "1px solid rgba(15,118,110,0.18)" : "1px solid rgba(245,158,11,0.25)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 0 }} className="main-grid">
        <div style={{ padding: 24, background: "linear-gradient(135deg,#ffffff,#f8fafc)" }}>
          <Badge label="v10 Profit Accuracy" tone={hasData ? "success" : "warning"} />
          <h2 style={{ margin: "14px 0 8px", fontSize: 32, lineHeight: 1.1, letterSpacing: -1 }}>Ubah dashboard kosong jadi profit pertama seller.</h2>
          <p style={{ color: "#64748b", lineHeight: 1.75, maxWidth: 820, margin: 0 }}>
            {hasData
              ? `Data pertama sudah masuk. Fokus berikutnya: baca produk paling untung, stok kritis, dan cashflow leak agar seller langsung merasakan value AI.`
              : `Belum ada transaksi real. Untuk user pertama, pengalaman terbaik adalah import CSV marketplace lalu langsung melihat profit asli, bukan angka Rp0.`}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <label style={{ ...ctaButtonStyle, display: "inline-flex", cursor: "pointer", alignItems: "center", gap: 8 }}>
              {syncing ? "Mengimpor data..." : hasData ? "Import CSV lagi" : "Import CSV pertama"}
              <input type="file" accept=".csv,text/csv" onChange={onImportCSV} disabled={syncing} style={{ display: "none" }} />
            </label>
            <button onClick={onGoProducts} style={ghostButtonStyle}>Tambah produk manual</button>
            <button onClick={hasData ? onGoAI : onGoMarketplace} style={ghostButtonStyle}>{hasData ? "Lihat AI insight" : "Buka marketplace"}</button>
            <button onClick={onGoBilling} style={ghostButtonStyle}>Aktifkan PRO manual</button>
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}><strong>Activation readiness</strong><span style={{ color: "#0f766e", fontWeight: 900 }}>{activationScore}%</span></div>
            <Progress value={activationScore} />
          </div>
        </div>
        <div style={{ padding: 24, background: "radial-gradient(circle at top right, rgba(20,184,166,0.18), transparent 42%), #f8fafc", borderLeft: "1px solid rgba(16,24,40,0.08)" }}>
          <div style={{ display: "grid", gap: 10 }}>
            <Step number={1} title="Workspace siap" description={isDemoMode ? "Demo mode aktif sampai user login." : userEmail ? `Owner ${userEmail} sudah terdeteksi.` : "Owner dan workspace sudah terdeteksi."} done={!!workspaceId || isDemoMode} />
            <Step number={2} title="Toko pertama" description={hasStore ? `${stores[0]?.name || "Toko utama"} sudah tersedia.` : "Buat toko otomatis agar data CSV punya channel."} done={hasStore || isDemoMode} />
            <Step number={3} title="Data marketplace" description={lastSync ? `Last import ${lastSync}.` : "Import CSV Shopee/Tokopedia/TikTok untuk membuka dashboard."} done={hasData} />
            <Step number={4} title="AI action pertama" description={hasInsight ? `AI sudah bisa membaca ${products.length} produk.` : "Insight muncul otomatis setelah data masuk."} done={hasInsight} />
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 1, background: "#e2e8f0" }} className="metrics-grid">
        <div style={{ padding: 18, background: "#ffffff" }}><small style={{ color: "#64748b" }}>Omzet real</small><h3 style={{ margin: "6px 0", color: "#175cd3" }}>{money(metrics.totalRevenue)}</h3><small style={{ color: "#64748b" }}>{metrics.totalUnits} unit dari CSV/manual</small></div>
        <div style={{ padding: 18, background: "#ffffff" }}><small style={{ color: "#64748b" }}>Profit bersih</small><h3 style={{ margin: "6px 0", color: metrics.netCash >= 0 ? "#0f766e" : "#b42318" }}>{money(metrics.netCash)}</h3><small style={{ color: "#64748b" }}>Margin avg {percent(metrics.avgMargin)}</small></div>
        <div style={{ padding: 18, background: "#ffffff" }}><small style={{ color: "#64748b" }}>Produk terbaik</small><h3 style={{ margin: "6px 0", color: "#0f172a" }}>{topProduct?.name || "Belum ada"}</h3><small style={{ color: "#64748b" }}>{topProduct ? money(topProduct.profit) : "Import CSV dulu"}</small></div>
        <div style={{ padding: 18, background: "#ffffff" }}><small style={{ color: "#64748b" }}>Risk score</small><h3 style={{ margin: "6px 0", color: metrics.riskScore >= 50 ? "#b42318" : "#0f766e" }}>{metrics.riskScore}/100</h3><small style={{ color: "#64748b" }}>{metrics.lowStockCount + metrics.outOfStockCount} stok perlu aksi</small></div>
      </div>
    </section>
  );
}
