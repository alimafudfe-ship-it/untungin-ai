import type { DashboardMetrics, Expense, Product } from "@/types/dashboard";
import { buildFounderActionPlan, buildGrowthMetrics } from "@/lib/saas/actionPlan";
import { compactMoney, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle, Progress, StatCard } from "./ui";

type Props = {
  products: Product[];
  expenses: Expense[];
  metrics: DashboardMetrics;
  userEmail: string | null;
  onGoMarketplace: () => void;
  onGoAI: () => void;
  onGoBilling: () => void;
};

const acquisitionPlays = [
  { title: "Free Profit Audit", channel: "TikTok, Shopee community", detail: "Seller upload CSV dan langsung dapat laporan profit asli gratis. Ini jadi wedge untuk akuisisi." },
  { title: "Daily CFO WhatsApp", channel: "Retention", detail: "Briefing harian membuat produk terasa dipakai setiap pagi, bukan cuma dibuka saat laporan." },
  { title: "Template HPP Indonesia", channel: "SEO + lead magnet", detail: "Buat kalkulator HPP, fee Shopee/Tokopedia, COD, voucher, affiliate, dan iklan." },
];

const founderChecklist = [
  "User upload CSV pertama dalam 5 menit",
  "AI memberi 3 tindakan yang jelas, bukan cuma chart",
  "Upgrade tetap jalan walau payment gateway ditolak",
  "Mobile owner view lebih nyaman dari desktop",
  "Setiap fitur punya metrik: activation, retention, revenue",
];

export function GrowthEnginePanel({ products = [], expenses = [], metrics, userEmail, onGoMarketplace, onGoAI, onGoBilling }: Props) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const actions = buildFounderActionPlan(safeProducts, safeExpenses, metrics);
  const growthMetrics = buildGrowthMetrics(safeProducts, metrics);
  const profitableProducts = safeProducts.filter((item) => item.profit > 0).length;
  const realDataReady = safeProducts.length > 0;
  const netMargin = metrics.totalRevenue > 0 ? (metrics.netCash / metrics.totalRevenue) * 100 : 0;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ ...cardStyle, color: "white", background: "radial-gradient(circle at top right, rgba(20,184,166,0.38), transparent 34%), linear-gradient(135deg,#020617,#0f172a 58%,#115e59)", border: "1px solid rgba(255,255,255,0.14)", overflow: "hidden" }}>
        <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 22, alignItems: "center" }}>
          <div>
            <Badge label="Untungin.ai v11 Auto Mapping" tone="success" />
            <h2 style={{ margin: "14px 0 10px", fontSize: 42, lineHeight: 1.02, letterSpacing: -1.4 }}>Akselerasi bisnis dengan data real, keputusan cepat, dan upgrade jelas.</h2>
            <p style={{ color: "#d1fae5", lineHeight: 1.75, maxWidth: 820 }}>Fokus halaman ini adalah mempercepat operasional: import data marketplace, cek fee, voucher, ongkir, pajak, HPP, lalu ubah insight menjadi aksi yang bisa dieksekusi owner.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button onClick={onGoMarketplace} style={ctaButtonStyle}>Aktifkan data real</button>
              <button onClick={onGoAI} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.20)" }}>Buat AI plan</button>
              <button onClick={onGoBilling} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.20)" }}>Siapkan pembayaran</button>
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 18, borderRadius: 22, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.16)" }}>
              <small style={{ color: "#99f6e4" }}>Workspace</small>
              <h3 style={{ margin: "8px 0 2px" }}>{userEmail ?? "Demo seller"}</h3>
              <p style={{ margin: 0, color: "#cbd5e1" }}>{realDataReady ? "Real-data mode aktif" : "Butuh import CSV pertama"}</p>
            </div>
            <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.10)" }}><small>Net margin</small><h2 style={{ margin: "6px 0" }}>{percent(netMargin)}</h2><Progress value={Math.max(0, Math.min(100, netMargin))} /></div>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.10)" }}><small>Produk profit</small><h2 style={{ margin: "6px 0" }}>{profitableProducts}/{safeProducts.length || 1}</h2><Progress value={(profitableProducts / Math.max(safeProducts.length, 1)) * 100} /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {growthMetrics.map((item) => <StatCard key={item.label} label={item.label} value={item.value} helper={item.helper} tone={item.tone} />)}
      </section>

      <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
        <div style={cardStyle}>
          <Badge label="Papan aksi owner" tone="success" />
          <h2 style={{ margin: "12px 0" }}>5 tindakan paling penting minggu ini</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {actions.map((action) => (
              <div key={action.id} style={{ padding: 16, borderRadius: 20, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div><Badge label={action.urgency} tone={action.tone} /><h3 style={{ margin: "8px 0 4px" }}>{action.title}</h3></div>
                  <div style={{ textAlign: "right" }}><small style={{ color: "#64748b" }}>Owner</small><br /><strong>{action.owner}</strong></div>
                </div>
                <p style={{ color: "#475569", lineHeight: 1.65, margin: "8px 0" }}>{action.detail}</p>
                <small style={{ color: "#0f766e", fontWeight: 850 }}>{action.impact}: {action.successMetric}</small>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div style={cardStyle}>
            <Badge label="Metrik utama" tone="blue" />
            <h2 style={{ margin: "12px 0" }}>Keputusan profit yang dieksekusi</h2>
            <p style={{ color: "#64748b", lineHeight: 1.7 }}>Ukuran sukses bukan banyaknya menu, tapi berapa keputusan owner yang terjadi karena Untungin.ai: restock, stop promo, scale produk, atau audit biaya.</p>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              <div><small>Real data readiness <b style={{ float: "right" }}>{realDataReady ? "Aktif" : "Belum"}</b></small><Progress value={realDataReady ? 88 : 22} /></div>
              <div><small>Net cash <b style={{ float: "right" }}>{compactMoney(metrics.netCash)}</b></small><Progress value={Math.max(0, Math.min(100, metrics.netCash / Math.max(metrics.totalRevenue, 1) * 100))} /></div>
              <div><small>Stock risk <b style={{ float: "right" }}>{metrics.lowStockCount + metrics.outOfStockCount} SKU</b></small><Progress value={Math.max(0, 100 - (metrics.lowStockCount + metrics.outOfStockCount) * 20)} /></div>
            </div>
          </div>
          <div style={cardStyle}>
            <Badge label="Cadangan pembayaran" tone="warning" />
            <h2 style={{ margin: "12px 0" }}>Upgrade tetap jalan</h2>
            <p style={{ color: "#64748b", lineHeight: 1.7 }}>Midtrans ditolak bukan blocker. v11 tetap siapkan manual transfer, Xendit, dan approval internal untuk early customer.</p>
            <button onClick={onGoBilling} style={{ ...ctaButtonStyle, width: "100%" }}>Cek paket PRO</button>
          </div>
        </div>
      </section>

      <section className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {acquisitionPlays.map((item) => (
          <div key={item.title} style={cardStyle}>
            <Badge label={item.channel} tone="blue" />
            <h3 style={{ margin: "12px 0 6px" }}>{item.title}</h3>
            <p style={{ color: "#64748b", lineHeight: 1.65, margin: 0 }}>{item.detail}</p>
          </div>
        ))}
      </section>

      <section style={cardStyle}>
        <Badge label="Checklist bisnis siap skala" tone="success" />
        <h2 style={{ margin: "12px 0" }}>Yang harus benar sebelum scale lebih jauh</h2>
        <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {founderChecklist.map((item, index) => (
            <div key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 14, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <span style={{ width: 28, height: 28, borderRadius: 999, display: "grid", placeItems: "center", background: "#ccfbf1", color: "#0f766e", fontWeight: 950 }}>{index + 1}</span>
              <strong style={{ lineHeight: 1.5 }}>{item}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
