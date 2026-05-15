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
};

const moduleCards = [
  { title: "Login seller", status: "Supabase Auth", detail: "Google/magic link + session Supabase untuk seller dan team workspace." },
  { title: "Multi-store", status: "Production schema", detail: "1 workspace bisa punya banyak toko: Shopee, Tokopedia, TikTok Shop, Lazada, reseller, dan manual." },
  { title: "CSV marketplace", status: "Real import", detail: "Parser Shopee/Tokopedia/TikTok/Lazada dengan mapping kolom fleksibel." },
  { title: "AI insight", status: "AI-first", detail: "Rekomendasi restock, pricing, cashflow, dan expense leak." },
  { title: "Midtrans subscription", status: "Payment ready", detail: "Plan Free/PRO, webhook, upgrade, dan billing flow." },
  { title: "Team access", status: "RBAC", detail: "Owner, finance, operator, analyst, dan viewer." },
];

export function SaaSPlatformPanel({ products, metrics, userEmail, isPro, lastSync, onGoMarketplace, onGoTeam, onUpgrade }: Props) {
  const profitable = products.filter((item) => item.profit > 0).length;
  const health = Math.max(0, Math.min(100, Math.round(100 - metrics.riskScore)));
  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div style={{ ...cardStyle, background: "linear-gradient(135deg,#07111f,#0f766e)", color: "white", border: "1px solid rgba(255,255,255,0.16)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", right: -90, top: -120, width: 360, height: 360, borderRadius: 999, background: "rgba(20,184,166,0.28)", filter: "blur(4px)" }} />
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 22 }} className="main-grid">
          <div>
            <Badge label="Untungin.ai v6 Real Data" tone="success" />
            <h2 style={{ margin: "14px 0 8px", fontSize: 36, lineHeight: 1.05, letterSpacing: -1.3 }}>AI-first operating system untuk seller marketplace Indonesia.</h2>
            <p style={{ color: "#d1fae5", lineHeight: 1.75, maxWidth: 760 }}>Dashboard ini sudah disiapkan untuk data real: Supabase Auth, workspace, multi-store, CSV import marketplace, realtime hooks, AI insight generator, subscription, dan team access.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button onClick={onGoMarketplace} style={{ ...ctaButtonStyle, background: "white", color: "#0f172a" }}>Connect marketplace</button>
              <button onClick={onGoTeam} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.10)", color: "white", borderColor: "rgba(255,255,255,0.22)" }}>Atur team</button>
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
              <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.10)" }}><small>Produk profit</small><h2 style={{ margin: "6px 0" }}>{profitable}/{products.length}</h2><Progress value={products.length ? (profitable / products.length) * 100 : 0} /></div>
            </div>
          </div>
        </div>
      </div>
      <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard label="Net cash" value={compactMoney(metrics.netCash)} helper="Realtime cashflow" tone={metrics.netCash >= 0 ? "success" : "danger"} />
        <StatCard label="Avg margin" value={percent(metrics.avgMargin)} helper="Setelah HPP" tone={metrics.avgMargin >= 25 ? "success" : "warning"} />
        <StatCard label="Inventory value" value={compactMoney(metrics.inventoryValue)} helper="Modal terkunci" tone="neutral" />
        <StatCard label="Expense leak" value={money(metrics.dailyLeakEstimate)} helper="Estimasi per hari" tone={metrics.dailyLeakEstimate > 0 ? "warning" : "success"} />
      </div>
      <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {moduleCards.map((item) => (
          <div key={item.title} style={cardStyle}>
            <Badge label={item.status} tone={item.status.includes("Ready") || item.status.includes("Live") || item.status.includes("Payment") ? "success" : "blue"} />
            <h3 style={{ margin: "12px 0 6px" }}>{item.title}</h3>
            <p style={{ color: "#64748b", lineHeight: 1.65, margin: 0 }}>{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
