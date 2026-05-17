import { useState } from "react";
import type React from "react";
import type { TabKey } from "@/types/dashboard";
import { Badge, ctaButtonStyle, ghostButtonStyle } from "./ui";

const navGroups: { label: string; items: { key: TabKey; label: string; helper: string; icon: string }[] }[] = [
  {
    label: "Operasional",
    items: [
      { key: "overview", label: "Pusat Kontrol", helper: "KPI & aksi", icon: "O" },
      { key: "products", label: "Produk", helper: "HPP & margin", icon: "P" },
      { key: "cashflow", label: "Arus Kas", helper: "Masuk / keluar", icon: "C" },
      { key: "inventory", label: "Stok", helper: "Kontrol stok", icon: "I" },
      { key: "sales", label: "Penjualan", helper: "Input order", icon: "S" },
    ],
  },
  {
    label: "Analitik",
    items: [
      { key: "ai", label: "Insight AI", helper: "Rencana aksi", icon: "AI" },
      { key: "assistant", label: "Chat Keuangan", helper: "Tanya data", icon: "FC" },
      { key: "forecast", label: "Proyeksi", helper: "30 hari", icon: "F" },
      { key: "reports", label: "Laporan", helper: "PDF & CSV", icon: "R" },
    ],
  },
  {
    label: "Pertumbuhan",
    items: [
      { key: "marketplace", label: "Integrasi", helper: "CSV & API", icon: "M" },
      { key: "automation", label: "Otomasi", helper: "Peringatan", icon: "A" },
      { key: "team", label: "Tim", helper: "Ruang kerja", icon: "T" },
      { key: "goals", label: "Target", helper: "Target", icon: "G" },
      { key: "growth", label: "Pertumbuhan", helper: "Retensi", icon: "GR" },
      { key: "pricing", label: "Paket", helper: "Langganan", icon: "B" },
    ],
  },
];

const navItems = navGroups.flatMap((group) => group.items);
const mobileItems: TabKey[] = ["overview", "products", "cashflow", "ai", "reports"];

const meta: Record<TabKey, { title: string; subtitle: string; eyebrow: string }> = {
  overview: { eyebrow: "Ruang kerja", title: "Pusat Kontrol Seller", subtitle: "Satu layar untuk profit, arus kas, risiko stok, dan keputusan harian." },
  products: { eyebrow: "Katalog", title: "Profitabilitas Produk", subtitle: "Kelola HPP, harga jual, fee, margin, dan performa SKU." },
  cashflow: { eyebrow: "Keuangan", title: "Kontrol Arus Kas", subtitle: "Pantau uang masuk, biaya, kebocoran, dan daya tahan kas." },
  inventory: { eyebrow: "Operasional", title: "Kontrol Stok", subtitle: "Prioritaskan stok kritis dan isi ulang stok berbasis profit." },
  sales: { eyebrow: "Order", title: "Input Penjualan", subtitle: "Catat order cepat dan update stok otomatis." },
  ai: { eyebrow: "AI CFO", title: "Rencana Aksi AI", subtitle: "Rekomendasi tindakan berdasarkan profit, stok, biaya, dan target." },
  reports: { eyebrow: "Pelaporan", title: "Laporan Eksekutif", subtitle: "Ekspor laporan untuk pemilik, mitra, dan arsip bisnis." },
  marketplace: { eyebrow: "Data", title: "Integrasi Marketplace", subtitle: "Impor dan sinkronisasi channel penjualan." },
  forecast: { eyebrow: "Perencanaan", title: "Proyeksi Bisnis", subtitle: "Prediksi profit, arus kas, dan risiko 30 hari." },
  automation: { eyebrow: "Alur kerja", title: "Pusat Otomasi", subtitle: "Laporan harian, WhatsApp alert, dan alur kerja operasional." },
  team: { eyebrow: "Ruang kerja", title: "Akses Tim", subtitle: "Akses admin, finance, dan operator toko." },
  assistant: { eyebrow: "AI", title: "Chat Keuangan", subtitle: "Tanya data bisnis dengan bahasa natural." },
  goals: { eyebrow: "Target", title: "Target Bisnis", subtitle: "Pantau progres omzet dan profit bulanan." },
  moat: { eyebrow: "Strategi", title: "Sistem Operasi Startup", subtitle: "Strategi menang dari kompetitor dengan alur kerja berbasis AI." },
  growth: { eyebrow: "Pertumbuhan", title: "Mesin Pertumbuhan", subtitle: "Aktivasi, retensi, monetisasi, dan papan aksi pendiri." },
  pricing: { eyebrow: "Langganan", title: "Paket & Pembayaran", subtitle: "Naikkan ke PRO, Xendit, transfer manual, dan cadangan pembayaran." },
};

export function AppShell({
  activeTab,
  onTabChange,
  isPro,
  proExpired,
  onExport,
  onUpgrade,
  onLogout,
  children,
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  isPro: boolean;
  proExpired: boolean;
  onExport: () => void;
  onUpgrade: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const current = meta[activeTab];
  const [darkMode, setDarkMode] = useState(false);
  const planLabel = isPro ? "PRO" : proExpired ? "Kedaluwarsa" : "Gratis";

  return <main className={darkMode ? "dark-preview" : ""} style={{ minHeight: "100vh", color: darkMode ? "#e5e7eb" : "#111827", background: darkMode ? "#020617" : "#f3f6fb", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", overflowX: "hidden" }}>
    <style>{`
      * { box-sizing: border-box; }
      html, body { overflow-x: hidden; }
      button, label { transition: 160ms ease; }
      button:hover, label:hover { transform: translateY(-1px); filter: brightness(1.02); }
      input::placeholder, textarea::placeholder { color: #98a2b3; }
      .sidebar-scroll::-webkit-scrollbar, .mobile-nav::-webkit-scrollbar { height: 7px; width: 7px; }
      .sidebar-scroll::-webkit-scrollbar-thumb, .mobile-nav::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.18); border-radius: 999px; }
      .dark-preview .shell-panel, .dark-preview .topbar, .dark-preview .search-shell { background: rgba(15,23,42,0.78) !important; border-color: rgba(148,163,184,0.18) !important; }
      .dark-preview .shell-text-muted { color: #94a3b8 !important; }
      .dark-preview .search-input { color: #e2e8f0 !important; }
      .dark-preview .nav-cta-card { background: rgba(15,23,42,0.72) !important; border-color: rgba(148,163,184,0.18) !important; }
      .dark-preview .nav-selected { background: rgba(255,255,255,0.04) !important; }
      .app-shell { display: grid; grid-template-columns: 258px minmax(0, 1fr); min-height: 100vh; }
      .content-shell { min-width: 0; overflow-x: hidden; }
      .topbar-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: flex-end; min-width: 0; }
      .search-shell { display: flex; align-items: center; gap: 10px; min-width: min(280px, 100%); padding: 0 12px; border-radius: 16px; border: 1px solid rgba(15,23,42,0.08); background: rgba(255,255,255,0.86); box-shadow: 0 8px 24px rgba(15,23,42,0.04); }
      .search-input { border: 0; outline: none; background: transparent; width: 100%; color: #111827; font-size: 14px; font-weight: 600; padding: 10px 0; }
      .sidebar-section-title { padding: 0 10px; color: #98a2b3; font-size: 10px; font-weight: 900; letter-spacing: 0.7px; text-transform: uppercase; }
      .sidebar-item { display: grid; grid-template-columns: 30px 1fr; align-items: center; gap: 10px; text-align: left; border: 1px solid transparent; border-radius: 14px; padding: 7px 8px; background: transparent; color: #475467; cursor: pointer; font-weight: 850; min-width: 0; }
      .sidebar-item strong, .sidebar-item small, .sidebar-item span { min-width: 0; }
      .sidebar-item small { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sidebar-item .sidebar-icon { width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; background: #f2f4f7; color: #475467; font-size: 11px; font-weight: 950; }
      .sidebar-item.nav-selected { border-color: rgba(15,118,110,0.18); background: #ffffff; color: #0f766e; box-shadow: 0 14px 34px rgba(15,23,42,0.08); }
      .sidebar-item.nav-selected .sidebar-icon { background: linear-gradient(135deg,#0f766e,#14b8a6); color: white; }
      .mobile-nav { display: none; }
      .nav-mini-button { white-space: nowrap; border: 1px solid #e5e7eb; background: white; color: #475467; border-radius: 14px; padding: 10px 12px; font-weight: 850; }
      .nav-mini-button.active { border-color: rgba(15,118,110,0.22); background: #ecfdf5; color: #0f766e; }
      .topbar-title { display: block; font-size: 20px; letter-spacing: -0.55px; margin-top: 3px; }
      .icon-only { font-size: 15px; line-height: 1; }
      @media (max-width: 1320px) {
        .search-shell { min-width: 260px; }
      }
      @media (max-width: 1180px) {
        .app-shell { grid-template-columns: 1fr !important; }
        .sidebar { display: none !important; }
        .mobile-nav { display: flex !important; }
        .content-shell { padding: 14px !important; padding-bottom: 104px !important; }
      }
      @media (max-width: 900px) {
        .topbar { grid-template-columns: 1fr !important; }
        .topbar-actions { justify-content: flex-start !important; }
      }
      @media (max-width: 720px) {
        .topbar { padding: 14px !important; border-radius: 22px !important; }
        .topbar-title { font-size: 19px !important; }
        .topbar-actions { display: grid !important; grid-template-columns: 1fr 1fr; width: 100%; }
        .topbar-actions .search-shell { grid-column: 1 / -1; min-width: 100%; }
        .topbar-actions .full-span { grid-column: 1 / -1; }
        .content-shell { padding: 12px !important; }
      }
      @media (max-width: 520px) {
        .topbar-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .mobile-nav { left: 8px !important; right: 8px !important; bottom: 8px !important; }
      }
    `}</style>
    <div className="app-shell">
      <aside className="sidebar shell-panel" style={{ position: "sticky", top: 0, height: "100vh", padding: 12, background: "rgba(255,255,255,0.86)", borderRight: "1px solid rgba(15,23,42,0.08)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 6px 14px", borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0f766e,#14b8a6)", color: "white", fontWeight: 950, boxShadow: "0 16px 30px rgba(15,118,110,0.24)" }}>U</div>
          <div><strong style={{ fontSize: 16, letterSpacing: -0.3 }}>Untungin.ai</strong><div className="shell-text-muted" style={{ color: "#667085", fontSize: 12, marginTop: 2 }}>Sistem Operasi Seller</div></div>
        </div>

        <div style={{ padding: 10, borderRadius: 16, background: "linear-gradient(135deg,#0f172a,#134e4a)", color: "white", boxShadow: "0 18px 45px rgba(15,23,42,0.16)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><span style={{ fontSize: 12, color: "#cbd5e1" }}>Ruang kerja</span><Badge label={planLabel} tone={isPro ? "success" : proExpired ? "danger" : "warning"} /></div>
          <strong style={{ display: "block", marginTop: 6 }}>Toko Utama</strong>
          <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>Shopee, Tokopedia, TikTok Shop</div>
        </div>

        <div className="sidebar-scroll" style={{ overflowY: "auto", paddingRight: 4, flex: 1 }}>
          <nav style={{ display: "grid", gap: 10 }}>{navGroups.map((group) => <div key={group.label} style={{ display: "grid", gap: 6 }}>
            <div className="sidebar-section-title shell-text-muted">{group.label}</div>
            {group.items.map((item) => {
              const selected = activeTab === item.key;
              return <button key={item.key} className={`sidebar-item ${selected ? "nav-selected" : ""}`} onClick={() => onTabChange(item.key)} style={{ color: selected ? "#0f766e" : darkMode ? "#cbd5e1" : "#475467" }}>
                <span className="sidebar-icon">{item.icon}</span>
                <span>{item.label}<br /><small style={{ color: selected ? "#0f766e" : "#667085", fontWeight: 650 }}>{item.helper}</small></span>
              </button>;
            })}
          </div>)}</nav>
        </div>

        <div className="nav-cta-card" style={{ padding: 14, borderRadius: 18, background: "#ffffff", border: "1px solid rgba(15,23,42,0.08)", boxShadow: "0 16px 36px rgba(15,23,42,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><strong>PRO Pertumbuhan</strong><span style={{ fontSize: 12, color: "#667085" }}>AI + Tims</span></div>
          <p style={{ margin: "8px 0 12px", color: "#667085", fontSize: 12, lineHeight: 1.55 }}>Buka SKU tak terbatas, AI CFO, laporan otomatis, dan akses tim.</p>
          <button onClick={onUpgrade} style={{ ...ctaButtonStyle, width: "100%" }}>{isPro ? "Kelola paket" : "Naikkan ke PRO"}</button>
        </div>
      </aside>

      <section className="content-shell" style={{ padding: 18, minWidth: 0, width: "100%" }}>
        <div style={{ maxWidth: 1500, margin: "0 auto", width: "100%" }}>
          <div className="topbar" style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.90)", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 22, padding: "12px 14px", marginBottom: 14, backdropFilter: "blur(18px)", boxShadow: "0 18px 55px rgba(15,23,42,0.06)" }}>
            <div style={{ minWidth: 0 }}>
              <div className="shell-text-muted" style={{ color: "#667085", fontSize: 12, fontWeight: 850, letterSpacing: 0.3, textTransform: "uppercase" }}>{current.eyebrow}</div>
              <strong className="topbar-title">{current.title}</strong>
              <div className="shell-text-muted" style={{ color: "#667085", fontSize: 13, marginTop: 4 }}>{current.subtitle} {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</div>
            </div>

            <div className="topbar-actions">
              <div className="search-shell full-span">
                <span aria-hidden="true" style={{ color: "#98a2b3", fontSize: 14 }}>⌕</span>
                <input className="search-input" type="text" placeholder="Cari produk, laporan, atau insight..." readOnly />
              </div>
              <button type="button" aria-label="Notifikasi" style={{ ...ghostButtonStyle, padding: "9px 11px" }}><span className="icon-only">🔔</span></button>
              <button onClick={() => setDarkMode((value) => !value)} style={{ ...ghostButtonStyle, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span className="icon-only">{darkMode ? "☀" : "☾"}</span><span>{darkMode ? "Mode terang" : "Mode gelap"}</span></button>
              <button onClick={onExport} style={ghostButtonStyle}>Ekspor</button>
              {!isPro && <button onClick={onUpgrade} style={ctaButtonStyle}>{isPro ? "Kelola paket" : "Naikkan PRO"}</button>}
              <button type="button" style={{ ...ghostButtonStyle, display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 11px" }}><span style={{ width: 28, height: 28, borderRadius: 999, display: "grid", placeItems: "center", background: "#0f172a", color: "#ffffff", fontWeight: 900, fontSize: 12 }}>TA</span><span>Pemilik</span></button>
              <button onClick={onLogout} style={{ ...ghostButtonStyle, color: "#b42318", background: "#fff7f7", borderColor: "#fecaca" }}>Keluar</button>
            </div>
          </div>
          {children}
        </div>
      </section>
    </div>

    <nav className="mobile-nav" style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 30, gap: 8, overflowX: "auto", padding: 8, borderRadius: 22, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(15,23,42,0.10)", boxShadow: "0 18px 50px rgba(15,23,42,0.16)", backdropFilter: "blur(18px)" }}>
      {mobileItems.map((key) => {
        const item = navItems.find((entry) => entry.key === key);
        if (!item) return null;
        return <button key={item.key} className={`nav-mini-button ${activeTab === item.key ? "active" : ""}`} onClick={() => onTabChange(item.key)}>{item.label}</button>;
      })}
    </nav>
  </main>;
}
