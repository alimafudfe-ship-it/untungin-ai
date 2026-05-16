import { useState } from "react";
import type React from "react";
import type { TabKey } from "@/types/dashboard";
import { Badge, ctaButtonStyle, ghostButtonStyle } from "./ui";

const navGroups: { label: string; items: { key: TabKey; label: string; helper: string; icon: string }[] }[] = [
  { label: "Operate", items: [
    { key: "overview", label: "Command Center", helper: "KPI & actions", icon: "O" },
    { key: "products", label: "Products", helper: "HPP & margin", icon: "P" },
    { key: "cashflow", label: "Cashflow", helper: "In / out", icon: "C" },
    { key: "inventory", label: "Inventory", helper: "Stock control", icon: "I" },
    { key: "sales", label: "Sales", helper: "Order entry", icon: "S" },
  ] },
  { label: "Intelligence", items: [
    { key: "ai", label: "AI Insight", helper: "Action plan", icon: "AI" },
    { key: "assistant", label: "Finance Chat", helper: "Ask your data", icon: "FC" },
    { key: "forecast", label: "Forecast", helper: "30-day view", icon: "F" },
    { key: "reports", label: "Reports", helper: "PDF & CSV", icon: "R" },
  ] },
  { label: "Scale", items: [
    { key: "marketplace", label: "Integrations", helper: "CSV & API", icon: "M" },
    { key: "automation", label: "Automation", helper: "Alerts", icon: "A" },
    { key: "team", label: "Team", helper: "Workspace", icon: "T" },
    { key: "goals", label: "Goals", helper: "Targets", icon: "G" },
    { key: "growth", label: "Growth", helper: "Retention", icon: "GR" },
    { key: "pricing", label: "Billing", helper: "Plans", icon: "B" },
  ] },
];

const navItems = navGroups.flatMap((group) => group.items);

const meta: Record<TabKey, { title: string; subtitle: string; eyebrow: string }> = {
  overview: { eyebrow: "Workspace", title: "Seller Command Center", subtitle: "Satu layar untuk profit, cashflow, inventory risk, dan keputusan harian." },
  products: { eyebrow: "Catalog", title: "Product Profitability", subtitle: "Kelola HPP, harga jual, fee, margin, dan performa SKU." },
  cashflow: { eyebrow: "Finance", title: "Cashflow Control", subtitle: "Pantau uang masuk, biaya, kebocoran, dan runway." },
  inventory: { eyebrow: "Operations", title: "Inventory Control", subtitle: "Prioritaskan stok kritis dan restock berbasis profit." },
  sales: { eyebrow: "Orders", title: "Sales Entry", subtitle: "Catat order cepat dan update stok otomatis." },
  ai: { eyebrow: "AI CFO", title: "AI Action Plan", subtitle: "Rekomendasi tindakan berdasarkan profit, stok, biaya, dan target." },
  reports: { eyebrow: "Reporting", title: "Executive Reports", subtitle: "Export laporan untuk owner, partner, dan arsip bisnis." },
  marketplace: { eyebrow: "Data", title: "Marketplace Integrations", subtitle: "Import dan sinkronisasi channel penjualan." },
  forecast: { eyebrow: "Planning", title: "Business Forecast", subtitle: "Prediksi profit, cashflow, dan risiko 30 hari." },
  automation: { eyebrow: "Workflow", title: "Automation Center", subtitle: "Daily report, WhatsApp alert, dan operating workflow." },
  team: { eyebrow: "Workspace", title: "Team Access", subtitle: "Akses admin, finance, dan operator toko." },
  assistant: { eyebrow: "AI", title: "Finance Chat", subtitle: "Tanya data bisnis dengan bahasa natural." },
  goals: { eyebrow: "Targets", title: "Business Goals", subtitle: "Pantau progress omzet dan profit bulanan." },
  moat: { eyebrow: "Strategy", title: "Startup Operating System", subtitle: "Strategi menang dari kompetitor dengan AI-first workflow." },
  growth: { eyebrow: "Growth", title: "Growth Engine", subtitle: "Aktivasi, retention, monetization, dan founder action board." },
  pricing: { eyebrow: "Subscription", title: "Plans & Billing", subtitle: "Upgrade PRO, Xendit, manual transfer, dan fallback pembayaran." },
};

export function AppShell({ activeTab, onTabChange, isPro, proExpired, onExport, onUpgrade, onLogout, children }: { activeTab: TabKey; onTabChange: (tab: TabKey) => void; isPro: boolean; proExpired: boolean; onExport: () => void; onUpgrade: () => void; onLogout: () => void; children: React.ReactNode }) {
  const current = meta[activeTab];
  const [darkMode, setDarkMode] = useState(false);
  const planLabel = isPro ? "PRO" : proExpired ? "Expired" : "Free";

  return <main className={darkMode ? "dark-preview" : ""} style={{ minHeight: "100vh", color: darkMode ? "#e5e7eb" : "#111827", background: darkMode ? "#020617" : "#f3f6fb", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }}>
    <style>{`
      * { box-sizing: border-box; }
      button, label { transition: 160ms ease; }
      button:hover, label:hover { transform: translateY(-1px); filter: brightness(1.02); }
      input::placeholder, textarea::placeholder { color: #98a2b3; }
      .sidebar-scroll::-webkit-scrollbar, .mobile-nav::-webkit-scrollbar { height: 7px; width: 7px; }
      .sidebar-scroll::-webkit-scrollbar-thumb, .mobile-nav::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.18); border-radius: 999px; }
      .dark-preview .shell-panel, .dark-preview .topbar { background: rgba(15,23,42,0.78) !important; border-color: rgba(148,163,184,0.18) !important; }
      .dark-preview .shell-text-muted { color: #94a3b8 !important; }
      @media (max-width: 1080px) { .app-shell { grid-template-columns: 1fr !important; } .sidebar { display: none !important; } .mobile-nav { display: flex !important; } .content { padding: 14px !important; padding-bottom: 112px !important; } .hero-grid, .main-grid, .metrics-grid, .two-grid, .three-grid, .command-grid { grid-template-columns: 1fr !important; } .hero-title { font-size: 34px !important; letter-spacing: -1.1px !important; } .desktop-table { display: none !important; } .mobile-cards { display: grid !important; } .topbar { position: sticky !important; top: 10px; z-index: 20; } .topbar-actions { width: 100%; justify-content: flex-start !important; } }
    `}</style>
    <div className="app-shell" style={{ display: "grid", gridTemplateColumns: "292px 1fr", minHeight: "100vh" }}>
      <aside className="sidebar shell-panel" style={{ position: "sticky", top: 0, height: "100vh", padding: 18, background: "rgba(255,255,255,0.86)", borderRight: "1px solid rgba(15,23,42,0.08)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 6px 14px", borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0f766e,#14b8a6)", color: "white", fontWeight: 950, boxShadow: "0 16px 30px rgba(15,118,110,0.24)" }}>U</div>
          <div><strong style={{ fontSize: 18, letterSpacing: -0.4 }}>Untungin.ai</strong><div className="shell-text-muted" style={{ color: "#667085", fontSize: 12, marginTop: 2 }}>Seller Operating System</div></div>
        </div>

        <div style={{ padding: 12, borderRadius: 18, background: "linear-gradient(135deg,#0f172a,#134e4a)", color: "white", boxShadow: "0 18px 45px rgba(15,23,42,0.16)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><span style={{ fontSize: 12, color: "#cbd5e1" }}>Workspace</span><Badge label={planLabel} tone={isPro ? "success" : proExpired ? "danger" : "warning"} /></div>
          <strong style={{ display: "block", marginTop: 9 }}>Main Store</strong>
          <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>Shopee, Tokopedia, TikTok Shop</div>
        </div>

        <div className="sidebar-scroll" style={{ overflowY: "auto", paddingRight: 4, flex: 1 }}>
          <nav style={{ display: "grid", gap: 14 }}>{navGroups.map((group) => <div key={group.label} style={{ display: "grid", gap: 6 }}>
            <div className="shell-text-muted" style={{ padding: "0 10px", color: "#98a2b3", fontSize: 11, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase" }}>{group.label}</div>
            {group.items.map((item) => {
              const selected = activeTab === item.key;
              return <button key={item.key} onClick={() => onTabChange(item.key)} style={{ display: "grid", gridTemplateColumns: "36px 1fr", alignItems: "center", gap: 10, textAlign: "left", border: selected ? "1px solid rgba(15,118,110,0.18)" : "1px solid transparent", borderRadius: 16, padding: "9px 10px", background: selected ? "#ffffff" : "transparent", color: selected ? "#0f766e" : darkMode ? "#cbd5e1" : "#475467", cursor: "pointer", fontWeight: 850, boxShadow: selected ? "0 14px 34px rgba(15,23,42,0.08)" : "none" }}>
                <span style={{ width: 34, height: 34, borderRadius: 12, display: "grid", placeItems: "center", background: selected ? "linear-gradient(135deg,#0f766e,#14b8a6)" : "#f2f4f7", color: selected ? "white" : "#475467", fontSize: 11, fontWeight: 950 }}>{item.icon}</span>
                <span>{item.label}<br /><small style={{ color: selected ? "#0f766e" : "#667085", fontWeight: 650 }}>{item.helper}</small></span>
              </button>;
            })}
          </div>)}</nav>
        </div>

        <div style={{ padding: 14, borderRadius: 18, background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 16px 36px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><strong>PRO Growth</strong><span style={{ fontSize: 12, color: "#667085" }}>AI + Teams</span></div>
          <p style={{ margin: "8px 0 12px", color: "#667085", fontSize: 12, lineHeight: 1.55 }}>Buka unlimited SKU, AI CFO, report otomatis, dan akses tim.</p>
          <button onClick={onUpgrade} style={{ ...ctaButtonStyle, width: "100%" }}>{isPro ? "Manage plan" : "Upgrade PRO"}</button>
        </div>
      </aside>

      <section className="content" style={{ padding: 24, maxWidth: 1620, width: "100%" }}>
        <div className="topbar" style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.90)", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 24, padding: "14px 16px", marginBottom: 18, backdropFilter: "blur(18px)", boxShadow: "0 18px 55px rgba(15,23,42,0.06)" }}>
          <div style={{ minWidth: 0 }}>
            <div className="shell-text-muted" style={{ color: "#667085", fontSize: 12, fontWeight: 850, letterSpacing: 0.3, textTransform: "uppercase" }}>{current.eyebrow}</div>
            <strong style={{ display: "block", fontSize: 21, letterSpacing: -0.55, marginTop: 3 }}>{current.title}</strong>
            <div className="shell-text-muted" style={{ color: "#667085", fontSize: 13, marginTop: 4 }}>{current.subtitle} {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
          <div className="topbar-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
            <button type="button" style={{ ...ghostButtonStyle, minWidth: 180, textAlign: "left", color: "#667085", fontWeight: 750 }}>Search products, reports...</button>
            <button onClick={() => setDarkMode((value) => !value)} style={ghostButtonStyle}>{darkMode ? "Light" : "Dark"}</button>
            <button onClick={onExport} style={ghostButtonStyle}>Export</button>
            {!isPro && <button onClick={onUpgrade} style={ctaButtonStyle}>Upgrade</button>}
            <button onClick={onLogout} style={{ ...ghostButtonStyle, color: "#b42318", background: "#fff7f7", borderColor: "#fecaca" }}>Logout</button>
          </div>
        </div>
        {children}
      </section>
    </div>

    <nav className="mobile-nav" style={{ display: "none", position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 30, gap: 8, overflowX: "auto", padding: 8, borderRadius: 22, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(15,23,42,0.10)", boxShadow: "0 18px 50px rgba(15,23,42,0.16)", backdropFilter: "blur(18px)" }}>
      {navItems.slice(0, 8).map((item) => <button key={item.key} onClick={() => onTabChange(item.key)} style={{ whiteSpace: "nowrap", border: activeTab === item.key ? "1px solid rgba(15,118,110,0.22)" : "1px solid #e5e7eb", background: activeTab === item.key ? "#ecfdf5" : "white", color: activeTab === item.key ? "#0f766e" : "#475467", borderRadius: 14, padding: "10px 12px", fontWeight: 850 }}>{item.label}</button>)}
    </nav>
  </main>;
}
