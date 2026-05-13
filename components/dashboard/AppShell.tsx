import type React from "react";
import type { TabKey } from "@/types/dashboard";
import { Badge, ctaButtonStyle, ghostButtonStyle } from "./ui";

const navItems: { key: TabKey; label: string; helper: string; icon: string }[] = [
  { key: "overview", label: "Overview", helper: "Ringkasan bisnis", icon: "◎" },
  { key: "products", label: "Produk", helper: "Produk & margin", icon: "□" },
  { key: "cashflow", label: "Cashflow", helper: "Masuk & keluar", icon: "↕" },
  { key: "inventory", label: "Inventory", helper: "Stok & restock", icon: "▦" },
  { key: "sales", label: "Penjualan", helper: "Catat order", icon: "✓" },
  { key: "ai", label: "Insight", helper: "Rekomendasi", icon: "✦" },
  { key: "reports", label: "Reports", helper: "PDF & CSV", icon: "▤" },
  { key: "marketplace", label: "Marketplace", helper: "Sync & import", icon: "◇" },
  { key: "forecast", label: "Forecast", helper: "Prediksi AI", icon: "⌁" },
  { key: "goals", label: "Target", helper: "Goal tracker", icon: "○" },
  { key: "pricing", label: "Plans", helper: "Upgrade PRO", icon: "◇" },
];

const meta: Record<TabKey, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Ringkasan bisnis" },
  products: { title: "Produk", subtitle: "Produk & margin" },
  cashflow: { title: "Cashflow", subtitle: "Masuk & keluar" },
  inventory: { title: "Inventory", subtitle: "Stok & restock" },
  sales: { title: "Penjualan", subtitle: "Catat order" },
  ai: { title: "Insight", subtitle: "Rekomendasi" },
  reports: { title: "Reports", subtitle: "PDF & CSV" },
  marketplace: { title: "Marketplace", subtitle: "Sync & import" },
  forecast: { title: "Forecast", subtitle: "AI forecasting" },
  goals: { title: "Target", subtitle: "Goal tracker" },
  pricing: { title: "Plans", subtitle: "Upgrade PRO" },
};

export function AppShell({ activeTab, onTabChange, isPro, proExpired, onExport, onUpgrade, onLogout, children }: { activeTab: TabKey; onTabChange: (tab: TabKey) => void; isPro: boolean; proExpired: boolean; onExport: () => void; onUpgrade: () => void; onLogout: () => void; children: React.ReactNode }) {
  const current = meta[activeTab];
  return <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f8fafc,#eef3f8)", color: "#0f172a", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }}><style>{`
    * { box-sizing: border-box; } html { scroll-behavior: smooth; } button { transition: 160ms ease; } button:hover { transform: translateY(-1px); filter: brightness(1.02); } input::placeholder, textarea::placeholder { color: #94a3b8; } select { color-scheme: light; }
    @media (max-width: 980px) { .app-shell { grid-template-columns: 1fr !important; } .sidebar { display: none !important; } .mobile-nav { display: flex !important; } .content { padding: 14px !important; } .hero-grid, .main-grid, .metrics-grid, .two-grid, .three-grid { grid-template-columns: 1fr !important; } .hero-title { font-size: 36px !important; letter-spacing: -1.1px !important; } .desktop-table { display: none !important; } .mobile-cards { display: grid !important; } .topbar { position: sticky !important; top: 10px; z-index: 20; } .nav-actions { width: 100%; justify-content: flex-start !important; } }
  `}</style><div className="app-shell" style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh" }}><aside className="sidebar" style={{ position: "sticky", top: 0, height: "100vh", padding: 18, background: "rgba(255,255,255,0.84)", borderRight: "1px solid #e2e8f0", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}><div><div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 8px 28px" }}><div style={{ width: 42, height: 42, borderRadius: 13, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0f766e,#14b8a6)", color: "white", fontWeight: 950 }}>U</div><div><strong>Untungin.ai</strong><div style={{ color: "#64748b", fontSize: 12 }}>Seller operating system</div></div></div><nav style={{ display: "grid", gap: 8 }}>{navItems.map((item) => <button key={item.key} onClick={() => onTabChange(item.key)} style={{ display: "grid", gridTemplateColumns: "34px 1fr", alignItems: "center", gap: 10, textAlign: "left", border: "0", borderRadius: 14, padding: "11px 12px", background: activeTab === item.key ? "#0f172a" : "transparent", color: activeTab === item.key ? "white" : "#475569", cursor: "pointer", fontWeight: 800 }}><span style={{ width: 28, height: 28, borderRadius: 10, display: "grid", placeItems: "center", background: activeTab === item.key ? "rgba(255,255,255,0.08)" : "#eef2f7" }}>{item.icon}</span><span>{item.label}<br /><small style={{ color: activeTab === item.key ? "#cbd5e1" : "#64748b", fontWeight: 600 }}>{item.helper}</small></span></button>)}</nav></div><div style={{ padding: 14, borderRadius: 16, background: "#f1f5f9", border: "1px solid #dbe3ef" }}><small style={{ color: "#64748b" }}>Status akun</small><br /><strong>{isPro ? "PRO aktif" : "Free plan"}</strong><button onClick={onUpgrade} style={{ ...ctaButtonStyle, width: "100%", marginTop: 12 }}>Upgrade PRO</button></div></aside><section className="content" style={{ padding: 24, maxWidth: 1520, width: "100%" }}><div className="topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", background: "rgba(255,255,255,0.86)", border: "1px solid #dbe3ef", borderRadius: 20, padding: "12px 16px", marginBottom: 18, backdropFilter: "blur(16px)" }}><div><strong>{current.title}</strong><div style={{ color: "#64748b", fontSize: 12 }}>{current.subtitle} · {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div></div><div className="nav-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}><Badge label={isPro ? "PRO" : proExpired ? "Expired" : "Free"} tone={isPro ? "success" : proExpired ? "danger" : "warning"} /><button onClick={onExport} style={ghostButtonStyle}>Export</button>{!isPro && <button onClick={onUpgrade} style={ctaButtonStyle}>Upgrade</button>}<button onClick={onLogout} style={{ ...ghostButtonStyle, color: "#b91c1c", background: "#fff5f5", borderColor: "#fecaca" }}>Logout</button></div></div>{children}</section></div><nav className="mobile-nav" style={{ display: "none", position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 30, gap: 8, overflowX: "auto", padding: 8, borderRadius: 18, background: "rgba(255,255,255,0.92)", border: "1px solid #dbe3ef", boxShadow: "0 18px 50px rgba(15,23,42,0.16)", backdropFilter: "blur(18px)" }}>{navItems.map((item) => <button key={item.key} onClick={() => onTabChange(item.key)} style={{ ...ghostButtonStyle, whiteSpace: "nowrap", background: activeTab === item.key ? "#0f172a" : "white", color: activeTab === item.key ? "white" : "#0f172a" }}>{item.label}</button>)}</nav></main>;
}
