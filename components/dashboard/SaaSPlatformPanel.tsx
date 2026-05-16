import type { Product, DashboardMetrics } from "@/types/dashboard";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle, Progress, StatCard } from "./ui";

type Props = {
  products: Product[];
  metrics: DashboardMetrics;
  userEmail: string | null;
  isPro: boolean;
  lastSync: string | null;
  onGoMarketplace: () => void;
  onGoTeam: () => void;
  onUpgrade: () => void;
  onGoMoat?: () => void;
};

const moduleCards = [
  { title: "AI CFO Indonesia", status: "Core moat", detail: "Bukan cuma dashboard: sistem memberi keputusan harian tentang profit asli, stok, cashflow, COD, retur, iklan, dan pricing." },
  { title: "Real-data pipeline", status: "CSV + API path", detail: "CSV marketplace langsung dipakai untuk MVP. OAuth/API disiapkan untuk seller/partner yang sudah punya akses resmi." },
  { title: "Multi-store workspace", status: "Production schema", detail: "1 owner bisa mengelola banyak toko, gudang, staff, dan channel tanpa campur data." },
  { title: "Billing anti-blocker", status: "Gateway-safe", detail: "Karena payment gateway bisa menolak aktivasi, billing dibuat multi-provider: Xendit, manual transfer, lalu gateway lain." },
  { title: "Mobile seller command", status: "Indonesia-first", detail: "Bottom navigation dan card view disiapkan untuk seller yang lebih sering buka dari HP." },
  { title: "Growth engine", status: "Founder-ready", detail: "Produk harus mengukur aktivasi, insight pertama, retention, dan upgrade readiness dari user pertama." },
];

export function SaaSPlatformPanel({ products, metrics, userEmail, isPro, lastSync, onGoMarketplace, onGoTeam, onUpgrade, onGoMoat }: Props) {
  const profitable = products.filter((item) => item.profit > 0).length;
  const health = Math.max(0, Math.min(100, Math.round(100 - metrics.riskScore)));
  const netMargin = metrics.totalRevenue > 0 ? (metrics.netCash / metrics.totalRevenue) * 100 : 0;
  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div style={{ ...cardStyle, background: "radial-gradient(circle at top right, rgba(20,184,166,0.38), transparent 34%), linear-gradient(135deg,#06101f,#0f172a 52%,#0f766e)", color: "white", border: "1px solid rgba(255,255,255,0.16)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", right: -90, top: -120, width: 360, height: 360, borderRadius: 999, background: "rgba(20,184,166,0.24)", filter: "blur(4px)" }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 22 }} className="main-grid">
          <div>
            <Badge label="Untungin.ai v11 Auto Mapping" tone="success" />
            <h2 style={{ margin: "14px 0 8px", fontSize: 38, lineHeight: 1.02, letterSpacing: -1.5 }}>AI Profit OS yang harus lebih cepat dari ERP omnichannel biasa.</h2>
            <p style={{ color: "#d1fae5", lineHeight: 1.75, maxWidth: 820 }}>Arah produk sekarang: bukan hanya terlihat premium, tapi membuat seller pertama cepat aktif. Import CSV, lihat profit asli, dapat AI action plan, lalu upgrade manual/Xendit tanpa blocker Midtrans.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button onClick={onGoMarketplace} style={{ ...ctaButtonStyle, background: "white", color: "#0f172a" }}>Import CSV pertama</button>
              <button onClick={onGoMoat || onGoTeam} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.10)", color: "white", borderColor: "rgba(255,255,255,0.22)" }}>Lihat Founder OS</button>
              {!isPro && <button onClick={onUpgrade} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.10)", color: "white", borderColor: "rgba(255,255,255,0.22)" }}>Aktifkan PRO</button>}
            </div>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 18, borderRadius: 22, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(16px)" }}>
              <small style={{ color: "#ccfbf1" }}>Workspace aktif</small>
              <h3 style={{ margin: "6px 0 4px" }}>{userEmail || "Demo seller"}</h3>
              <p style={{ margin: 0, color: "#d1fae5" }}>{isPro ? "PRO active" : "Free plan"} · Last sync {lastSync || "belum ada"}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.10)" }}><small>Business health</small><h2 style={{ margin: "6px 0" }}>{health}/100</h2><Progress value={health} /></div>
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.10)" }}><small>Net margin</small><h2 style={{ margin: "6px 0" }}>{percent(netMargin)}</h2><Progress value={Math.max(0, Math.min(100, netMargin))} /></div>
            </div>
          </div>
        </div>
      </div>
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard label="Net cash" value={compactMoney(metrics.netCash)} helper="Keputusan cashflow harian" tone={metrics.netCash >= 0 ? "success" : "danger"} />
        <StatCard label="Avg margin" value={percent(metrics.avgMargin)} helper="Setelah HPP" tone={metrics.avgMargin >= 25 ? "success" : "warning"} />
        <StatCard label="Inventory value" value={compactMoney(metrics.inventoryValue)} helper="Modal terkunci" tone="neutral" />
        <StatCard label="Leak estimate" value={money(metrics.dailyLeakEstimate)} helper="Bocor per hari" tone={metrics.dailyLeakEstimate > 0 ? "warning" : "success"} />
      </div>
      <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {moduleCards.map((item) => (
          <div key={item.title} style={cardStyle}>
            <Badge label={item.status} tone={item.status.includes("Core") || item.status.includes("safe") ? "success" : "blue"} />
            <h3 style={{ margin: "12px 0 6px" }}>{item.title}</h3>
            <p style={{ color: "#64748b", lineHeight: 1.65, margin: 0 }}>{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
