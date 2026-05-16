import { useState } from "react";
import type React from "react";
import type { TabKey } from "@/types/dashboard";
import { Badge, ctaButtonStyle, ghostButtonStyle } from "./ui";

const navItems: { key: TabKey; label: string; helper: string; icon: string }[] = [
  { key: "overview", label: "Overview", helper: "Kondisi bisnis", icon: "🏠" },
  { key: "products", label: "Produk", helper: "HPP & margin", icon: "📦" },
  { key: "cashflow", label: "Cashflow", helper: "Masuk keluar", icon: "💸" },
  { key: "inventory", label: "Inventory", helper: "Stok & restock", icon: "🏷️" },
  { key: "sales", label: "Penjualan", helper: "Catat order", icon: "🛒" },
  { key: "ai", label: "Insight", helper: "Action plan", icon: "✨" },
  { key: "reports", label: "Reports", helper: "PDF & CSV", icon: "📊" },
  { key: "marketplace", label: "Marketplace", helper: "CSV & API", icon: "🛍️" },
  { key: "forecast", label: "Forecast", helper: "30 hari", icon: "📈" },
  { key: "automation", label: "Automation", helper: "Alert & report", icon: "⚡" },
  { key: "team", label: "Team", helper: "Multi-user", icon: "👥" },
  { key: "assistant", label: "AI Chat", helper: "Finance CFO", icon: "🤖" },
  { key: "goals", label: "Target", helper: "Goal tracker", icon: "🎯" },
  { key: "moat", label: "Startup OS", helper: "Moat & growth", icon: "🚀" },
  { key: "pricing", label: "Billing", helper: "Xendit/manual", icon: "💎" },
];

const meta: Record<TabKey, { title: string; subtitle: string }> = {
  overview: { title: "Business Command Center", subtitle: "Ringkasan profit, cashflow, stok, dan risiko" },
  products: { title: "Produk & Margin", subtitle: "Kelola HPP, harga jual, fee, dan performa SKU" },
  cashflow: { title: "Cashflow", subtitle: "Pantau uang masuk, biaya, dan kebocoran harian" },
  inventory: { title: "Inventory", subtitle: "Pantau stok kritis dan keputusan restock" },
  sales: { title: "Penjualan", subtitle: "Catat order cepat dan update stok otomatis" },
  ai: { title: "AI Insight", subtitle: "Rekomendasi tindakan berdasarkan data bisnis" },
  reports: { title: "Reports", subtitle: "Export laporan untuk owner, partner, dan arsip" },
  marketplace: { title: "Marketplace", subtitle: "Import dan sinkronisasi channel penjualan" },
  forecast: { title: "Forecast", subtitle: "Prediksi profit, cashflow, dan risiko 30 hari" },
  automation: { title: "Automation", subtitle: "Daily report, WhatsApp alert, dan workflow" },
  team: { title: "Team Workspace", subtitle: "Akses admin, finance, dan operator toko" },
  assistant: { title: "AI Finance Chat", subtitle: "Tanya data bisnis dengan bahasa natural" },
  goals: { title: "Target Bisnis", subtitle: "Pantau progress omzet dan profit bulanan" },
  moat: { title: "Startup Operating System", subtitle: "Strategi menang dari kompetitor dengan AI-first workflow" },
  pricing: { title: "Billing & Monetization", subtitle: "Xendit, manual transfer, dan subscription fallback" },
};

export function AppShell({ activeTab, onTabChange, isPro, proExpired, onExport, onUpgrade, onLogout, children }: { activeTab: TabKey; onTabChange: (tab: TabKey) => void; isPro: boolean; proExpired: boolean; onExport: () => void; onUpgrade: () => void; onLogout: () => void; children: React.ReactNode }) {
  const current = meta[activeTab];
  const [darkMode, setDarkMode] = useState(false);
  return <main className={darkMode ? "dark-preview" : ""} style={{ minHeight: "100vh", color: darkMode ? "#e5e7eb" : "#101828", background: darkMode ? "radial-gradient(circle at top right,#134e4a 0,#020617 42%,#0f172a 100%)" : "linear-gradient(135deg,#f7fafc,#eef6f5)", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }}><style>{`
    * { box-sizing: border-box; } button { transition: 160ms ease; } button:hover { transform: translateY(-1px); filter: brightness(1.02); } input::placeholder, textarea::placeholder { color: #98a2b3; } select { color-scheme: light; } .dark-preview .content > div, .dark-preview section, .dark-preview aside, .dark-preview nav { box-shadow: 0 18px 55px rgba(0,0,0,0.18); }
    .sidebar-scroll::-webkit-scrollbar, .mobile-nav::-webkit-scrollbar { height: 7px; width: 7px; } .sidebar-scroll::-webkit-scrollbar-thumb, .mobile-nav::-webkit-scrollbar-thumb { background: rgba(16,24,40,0.16); border-radius: 999px; }
    @media (max-width: 980px) { .app-shell { grid-template-columns: 1fr !important; } .sidebar { display: none !important; } .mobile-nav { display: flex !important; } .content { padding: 14px !important; } .hero-grid, .main-grid, .metrics-grid, .two-grid, .three-grid { grid-template-columns: 1fr !important; } .hero-title { font-size: 36px !important; letter-spacing: -1.1px !important; } .desktop-table { display: none !important; } .mobile-cards { display: grid !important; } .topbar { position: sticky !important; top: 10px; z-index: 20; } .content { padding-bottom: 112px !important; } .nav-actions { width: 100%; justify-content: flex-start !important; } }
  `}</style><div className="app-shell" style={{ display: "grid", gridTemplateColumns: "292px 1fr", minHeight: "100vh" }}>
    <aside className="sidebar" style={{ position: "sticky", top: 0, height: "100vh", padding: 18, background: "rgba(255,255,255,0.82)", borderRight: "1px solid rgba(16,24,40,0.09)", backdropFilter: "blur(18px)", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14 }}>
      <div className="sidebar-scroll" style={{ overflowY: "auto", paddingRight: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 8px 22px" }}><div style={{ width: 46, height: 46, borderRadius: 16, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0f766e,#14b8a6)", color: "white", fontWeight: 950, boxShadow: "0 16px 34px rgba(15,118,110,0.24)" }}>U</div><div><strong style={{ fontSize: 18 }}>Untungin.ai</strong><div style={{ color: "#667085", fontSize: 12 }}>Seller OS Indonesia</div></div></div>
        <nav style={{ display: "grid", gap: 7 }}>{navItems.map((item) => <button key={item.key} onClick={() => onTabChange(item.key)} style={{ display: "grid", gridTemplateColumns: "36px 1fr", alignItems: "center", gap: 10, textAlign: "left", border: activeTab === item.key ? "1px solid rgba(15,118,110,0.18)" : "1px solid transparent", borderRadius: 17, padding: "10px 11px", background: activeTab === item.key ? "linear-gradient(135deg,#0f766e,#14b8a6)" : "transparent", color: activeTab === item.key ? "white" : "#475467", cursor: "pointer", fontWeight: 850, boxShadow: activeTab === item.key ? "0 14px 30px rgba(15,118,110,0.20)" : "none" }}><span style={{ width: 31, height: 31, borderRadius: 12, display: "grid", placeItems: "center", background: activeTab === item.key ? "rgba(255,255,255,0.14)" : "#f2f4f7" }}>{item.icon}</span><span>{item.label}<br /><small style={{ color: activeTab === item.key ? "#dcfffb" : "#667085", fontWeight: 650 }}>{item.helper}</small></span></button>)}</nav>
      </div>
      <div style={{ padding: 15, borderRadius: 20, background: "linear-gradient(180deg,#ffffff,#f8fafc)", border: "1px solid rgba(16,24,40,0.10)", boxShadow: "0 18px 45px rgba(16,24,40,0.07)" }}><small style={{ color: "#667085" }}>Status akun</small><br /><strong>{isPro ? "PRO aktif" : proExpired ? "PRO expired" : "Free plan"}</strong><p style={{ margin: "8px 0 0", color: "#667085", fontSize: 12, lineHeight: 1.55 }}>Upgrade untuk AI CFO, multi-store, reports, dan insight lengkap.</p><button onClick={onUpgrade} style={{ ...ctaButtonStyle, width: "100%", marginTop: 12 }}>Upgrade PRO</button></div>
    </aside>
    <section className="content" style={{ padding: 24, maxWidth: 1560, width: "100%" }}>
      <div className="topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", background: "rgba(255,255,255,0.84)", border: "1px solid rgba(16,24,40,0.09)", borderRadius: 24, padding: "13px 16px", marginBottom: 18, backdropFilter: "blur(16px)", boxShadow: "0 18px 55px rgba(16,24,40,0.06)" }}><div><strong style={{ fontSize: 18 }}>{current.title}</strong><div style={{ color: "#667085", fontSize: 12, marginTop: 2 }}>{current.subtitle} · {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div></div><div className="nav-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}><Badge label={isPro ? "PRO" : proExpired ? "Expired" : "Free"} tone={isPro ? "success" : proExpired ? "danger" : "warning"} /><button onClick={() => setDarkMode((value) => !value)} style={ghostButtonStyle}>{darkMode ? "Light" : "Dark"}</button><button onClick={onExport} style={ghostButtonStyle}>Export data</button>{!isPro && <button onClick={onUpgrade} style={ctaButtonStyle}>Upgrade</button>}<button onClick={onLogout} style={{ ...ghostButtonStyle, color: "#b42318", background: "#fff7f7", borderColor: "#fecaca" }}>Logout</button></div></div>{children}</section>
  </div><nav className="mobile-nav" style={{ display: "none", position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 30, gap: 8, overflowX: "auto", padding: 8, borderRadius: 22, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(16,24,40,0.10)", boxShadow: "0 18px 50px rgba(16,24,40,0.16)", backdropFilter: "blur(18px)" }}>{navItems.map((item) => <button key={item.key} onClick={() => onTabChange(item.key)} style={{ ...ghostButtonStyle, whiteSpace: "nowrap", background: activeTab === item.key ? "linear-gradient(135deg,#0f766e,#14b8a6)" : "white", color: activeTab === item.key ? "white" : "#101828" }}>{item.icon} {item.label}</button>)}</nav></main>;
}
