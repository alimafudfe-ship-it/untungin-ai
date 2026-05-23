import { useEffect, useMemo, useState } from "react";
import type React from "react";
import type { TabKey } from "@/types/dashboard";
import { Badge, ctaButtonStyle, ghostButtonStyle } from "./ui";
import { LOCALE_EVENT, localeTag, normalizeLocale, type Locale } from "@/lib/dashboard/i18n";

type NavGroup = { label: string; items: { key: TabKey; label: string; helper: string; icon: string }[] };
type MetaMap = Record<TabKey, { title: string; subtitle: string; eyebrow: string }>;

const LOCALES: { key: Locale; label: string; short: string }[] = [
  { key: "id", label: "Indonesia", short: "ID" },
  { key: "en", label: "English", short: "EN" },
  { key: "ms", label: "Melayu", short: "MY" },
];

const NAV: Record<Locale, NavGroup[]> = {
  id: [
    { label: "Menu Utama", items: [
      { key: "overview", label: "Dashboard", helper: "KPI & aksi", icon: "D" },
      { key: "marketplace", label: "Integrasi", helper: "CSV & API", icon: "I" },
      { key: "trend", label: "Trend Produk", helper: "Produk laris", icon: "TP" },
      { key: "ai", label: "Insight AI", helper: "Rekomendasi", icon: "AI" },
      { key: "reports", label: "Laporan", helper: "PDF & CSV", icon: "L" },
    ] },
    { label: "Menu Lama", items: [
      { key: "products", label: "Produk", helper: "HPP & margin", icon: "P" },
      { key: "cashflow", label: "Cashflow", helper: "Masuk / keluar", icon: "C" },
      { key: "inventory", label: "Stok", helper: "Kontrol stok", icon: "S" },
      { key: "sales", label: "Sales", helper: "Input order", icon: "SA" },
      { key: "forecast", label: "Forecast", helper: "30 hari", icon: "F" },
      { key: "automation", label: "Automation", helper: "Peringatan", icon: "A" },
      { key: "team", label: "Team", helper: "Ruang kerja", icon: "T" },
      { key: "pricing", label: "Billing", helper: "Langganan", icon: "B" },
      { key: "growth", label: "Growth", helper: "Aktivasi & retensi", icon: "G" },
    ] },
    { label: "Tambahan", items: [
      { key: "assistant", label: "Chat Keuangan", helper: "Tanya data", icon: "FC" },
      { key: "goals", label: "Target", helper: "Target", icon: "TG" },
    ] },
  ],
  en: [
    { label: "Main Menu", items: [
      { key: "overview", label: "Dashboard", helper: "KPIs & actions", icon: "D" },
      { key: "marketplace", label: "Integrations", helper: "CSV & API", icon: "I" },
      { key: "trend", label: "Product Trends", helper: "Best sellers", icon: "PT" },
      { key: "ai", label: "AI Insights", helper: "Recommendations", icon: "AI" },
      { key: "reports", label: "Reports", helper: "PDF & CSV", icon: "R" },
    ] },
    { label: "Legacy Menu", items: [
      { key: "products", label: "Products", helper: "COGS & margin", icon: "P" },
      { key: "cashflow", label: "Cashflow", helper: "In / out", icon: "C" },
      { key: "inventory", label: "Stock", helper: "Stock control", icon: "S" },
      { key: "sales", label: "Sales", helper: "Sales entry", icon: "SA" },
      { key: "forecast", label: "Forecast", helper: "30 days", icon: "F" },
      { key: "automation", label: "Automation", helper: "Alerts", icon: "A" },
      { key: "team", label: "Team", helper: "Workspace", icon: "T" },
      { key: "pricing", label: "Billing", helper: "Subscription", icon: "B" },
      { key: "growth", label: "Growth", helper: "Activation & retention", icon: "G" },
    ] },
    { label: "Extra", items: [
      { key: "assistant", label: "Finance Copilot", helper: "Ask your data", icon: "FC" },
      { key: "goals", label: "Goals", helper: "Targets", icon: "TG" },
    ] },
  ],
  ms: [
    { label: "Menu Utama", items: [
      { key: "overview", label: "Dashboard", helper: "KPI & tindakan", icon: "D" },
      { key: "marketplace", label: "Integrasi", helper: "CSV & API", icon: "I" },
      { key: "trend", label: "Trend Produk", helper: "Produk laris", icon: "TP" },
      { key: "ai", label: "Insight AI", helper: "Cadangan", icon: "AI" },
      { key: "reports", label: "Laporan", helper: "PDF & CSV", icon: "L" },
    ] },
    { label: "Menu Lama", items: [
      { key: "products", label: "Produk", helper: "Kos & margin", icon: "P" },
      { key: "cashflow", label: "Cashflow", helper: "Masuk / keluar", icon: "C" },
      { key: "inventory", label: "Stok", helper: "Kawalan stok", icon: "S" },
      { key: "sales", label: "Sales", helper: "Input pesanan", icon: "SA" },
      { key: "forecast", label: "Forecast", helper: "30 hari", icon: "F" },
      { key: "automation", label: "Automation", helper: "Amaran", icon: "A" },
      { key: "team", label: "Team", helper: "Ruang kerja", icon: "T" },
      { key: "pricing", label: "Billing", helper: "Bil", icon: "B" },
      { key: "growth", label: "Growth", helper: "Aktivasi & retensi", icon: "G" },
    ] },
    { label: "Tambahan", items: [
      { key: "assistant", label: "Copilot Kewangan", helper: "Tanya data", icon: "FC" },
      { key: "goals", label: "Sasaran", helper: "Target", icon: "TG" },
    ] },
  ],
};

const META: Record<Locale, MetaMap> = {
  id: {
    overview: { eyebrow: "Ruang kerja", title: "Pusat Kontrol Seller", subtitle: "Satu layar untuk profit, arus kas, risiko stok, dan keputusan harian." },
    products: { eyebrow: "Katalog", title: "Profitabilitas Produk", subtitle: "Kelola HPP, harga jual, fee, margin, dan performa SKU." },
    cashflow: { eyebrow: "Keuangan", title: "Kontrol Arus Kas", subtitle: "Pantau uang masuk, biaya, kebocoran, dan daya tahan kas." },
    inventory: { eyebrow: "Operasional", title: "Kontrol Stok", subtitle: "Prioritaskan stok kritis dan isi ulang stok berbasis profit." },
    sales: { eyebrow: "Order", title: "Input Penjualan", subtitle: "Catat order cepat dan update stok otomatis." },
    ai: { eyebrow: "AI CFO", title: "Rencana Aksi AI", subtitle: "Rekomendasi berdasarkan profit, stok, biaya, dan target." },
    reports: { eyebrow: "Pelaporan", title: "Laporan Eksekutif", subtitle: "Ekspor laporan untuk owner, mitra, dan arsip bisnis." },
    marketplace: { eyebrow: "Data", title: "Integrasi Marketplace", subtitle: "Impor dan sinkronisasi channel penjualan." },
    trend: { eyebrow: "Riset Produk", title: "Trend Produk Marketplace", subtitle: "Shopee, TikTok Shop, Tokopedia, dan Lazada trend analyzer." },
    forecast: { eyebrow: "Perencanaan", title: "Proyeksi Bisnis", subtitle: "Prediksi profit, arus kas, dan risiko 30 hari." },
    automation: { eyebrow: "Alur kerja", title: "Pusat Otomasi", subtitle: "Laporan harian, WhatsApp alert, dan operasi otomatis." },
    team: { eyebrow: "Ruang kerja", title: "Akses Tim", subtitle: "Akses admin, finance, dan operator toko." },
    assistant: { eyebrow: "AI", title: "Chat Keuangan", subtitle: "Tanya data bisnis dengan bahasa natural." },
    goals: { eyebrow: "Target", title: "Target Bisnis", subtitle: "Pantau progres omzet dan profit bulanan." },
    moat: { eyebrow: "Strategi", title: "Sistem Operasi Startup", subtitle: "Strategi menang dengan alur kerja berbasis AI." },
    growth: { eyebrow: "Skala", title: "Akselerasi Bisnis", subtitle: "Aktivasi, retensi, monetisasi, dan papan aksi owner." },
    pricing: { eyebrow: "Langganan", title: "Paket & Pembayaran", subtitle: "Upgrade ke PRO, invoice, dan cadangan pembayaran." },
  },
  en: {
    overview: { eyebrow: "Workspace", title: "Seller Command Center", subtitle: "One operating layer for profit, cash flow, inventory risk, and daily decisions." },
    products: { eyebrow: "Catalog", title: "Product Profitability", subtitle: "Manage COGS, price, fees, margin, and SKU performance." },
    cashflow: { eyebrow: "Finance", title: "Cash Flow Control", subtitle: "Track inflows, expenses, leakage, and cash runway." },
    inventory: { eyebrow: "Operations", title: "Inventory Control", subtitle: "Prioritize critical stock and profit-based restock decisions." },
    sales: { eyebrow: "Orders", title: "Sales Entry", subtitle: "Record orders quickly and update inventory automatically." },
    ai: { eyebrow: "AI CFO", title: "AI Action Plan", subtitle: "Recommendations based on profit, stock, expenses, and goals." },
    reports: { eyebrow: "Reporting", title: "Executive Reports", subtitle: "Export reports for owners, partners, and business archives." },
    marketplace: { eyebrow: "Data", title: "Marketplace Integrations", subtitle: "Import and sync sales channels." },
    trend: { eyebrow: "Product Research", title: "Marketplace Product Trends", subtitle: "Shopee, TikTok Shop, Tokopedia, and Lazada trend analyzer." },
    forecast: { eyebrow: "Planning", title: "Business Forecast", subtitle: "Forecast profit, cash flow, and risk for the next 30 days." },
    automation: { eyebrow: "Workflow", title: "Automation Center", subtitle: "Daily reports, WhatsApp alerts, and automated operations." },
    team: { eyebrow: "Workspace", title: "Team Access", subtitle: "Admin, finance, and store-operator access." },
    assistant: { eyebrow: "AI", title: "Finance Copilot", subtitle: "Ask your business data in natural language." },
    goals: { eyebrow: "Goals", title: "Business Goals", subtitle: "Track monthly revenue and profit progress." },
    moat: { eyebrow: "Strategy", title: "Startup Operating System", subtitle: "Win with AI-powered operating workflows." },
    growth: { eyebrow: "Scale", title: "Business Acceleration", subtitle: "Activation, retention, monetization, and owner action board." },
    pricing: { eyebrow: "Billing", title: "Plans & Payments", subtitle: "Upgrade to PRO, invoice, and payment fallback." },
  },
  ms: {
    overview: { eyebrow: "Ruang kerja", title: "Pusat Kawalan Seller", subtitle: "Satu lapisan operasi untuk untung, tunai, risiko stok, dan keputusan harian." },
    products: { eyebrow: "Katalog", title: "Keuntungan Produk", subtitle: "Urus kos, harga jual, fi, margin, dan prestasi SKU." },
    cashflow: { eyebrow: "Kewangan", title: "Kawalan Aliran Tunai", subtitle: "Pantau wang masuk, belanja, kebocoran, dan ketahanan tunai." },
    inventory: { eyebrow: "Operasi", title: "Kawalan Inventori", subtitle: "Utamakan stok kritikal dan restock berdasarkan profit." },
    sales: { eyebrow: "Pesanan", title: "Input Jualan", subtitle: "Catat pesanan cepat dan kemas kini stok automatik." },
    ai: { eyebrow: "AI CFO", title: "Pelan Tindakan AI", subtitle: "Cadangan berdasarkan untung, stok, belanja, dan sasaran." },
    reports: { eyebrow: "Laporan", title: "Laporan Eksekutif", subtitle: "Eksport laporan untuk pemilik, rakan niaga, dan arkib." },
    marketplace: { eyebrow: "Data", title: "Integrasi Marketplace", subtitle: "Import dan sinkronkan channel jualan." },
    trend: { eyebrow: "Riset Produk", title: "Trend Produk Marketplace", subtitle: "Shopee, TikTok Shop, Tokopedia, dan Lazada trend analyzer." },
    forecast: { eyebrow: "Perancangan", title: "Ramalan Bisnes", subtitle: "Ramalan untung, tunai, dan risiko 30 hari." },
    automation: { eyebrow: "Alur kerja", title: "Pusat Automasi", subtitle: "Laporan harian, WhatsApp alert, dan operasi automatik." },
    team: { eyebrow: "Ruang kerja", title: "Akses Pasukan", subtitle: "Akses admin, kewangan, dan operator toko." },
    assistant: { eyebrow: "AI", title: "Copilot Kewangan", subtitle: "Tanya data bisnes dengan bahasa natural." },
    goals: { eyebrow: "Sasaran", title: "Sasaran Bisnes", subtitle: "Pantau progres omzet dan untung bulanan." },
    moat: { eyebrow: "Strategi", title: "Sistem Operasi Startup", subtitle: "Menang dengan alur kerja berbasis AI." },
    growth: { eyebrow: "Skala", title: "Akselerasi Bisnes", subtitle: "Aktivasi, retensi, monetisasi, dan papan tindakan owner." },
    pricing: { eyebrow: "Bil", title: "Pelan & Pembayaran", subtitle: "Upgrade ke PRO, invoice, dan fallback pembayaran." },
  },
};

const UI = {
  id: { system: "Sistem Operasi Seller", workspace: "Ruang kerja", mainStore: "Toko Utama", channels: "Shopee, Tokopedia, TikTok Shop", scalePro: "PRO Skala", proHelper: "Buka SKU tak terbatas, AI CFO, laporan otomatis, dan akses tim.", managePlan: "Kelola paket", upgrade: "Naikkan ke PRO", search: "Cari produk, laporan, atau insight...", dark: "Mode gelap", light: "Mode terang", export: "Ekspor", owner: "Pemilik", logout: "Keluar", language: "Bahasa", expired: "Kedaluwarsa", free: "Gratis" },
  en: { system: "Seller Operating System", workspace: "Workspace", mainStore: "Main Store", channels: "Shopee, Tokopedia, TikTok Shop", scalePro: "Scale PRO", proHelper: "Unlock unlimited SKUs, AI CFO, automated reports, and team access.", managePlan: "Manage plan", upgrade: "Upgrade to PRO", search: "Search products, reports, or insights...", dark: "Dark mode", light: "Light mode", export: "Export", owner: "Owner", logout: "Logout", language: "Language", expired: "Expired", free: "Free" },
  ms: { system: "Sistem Operasi Seller", workspace: "Ruang kerja", mainStore: "Toko Utama", channels: "Shopee, Tokopedia, TikTok Shop", scalePro: "PRO Skala", proHelper: "Buka SKU tanpa had, AI CFO, laporan automatik, dan akses pasukan.", managePlan: "Urus pelan", upgrade: "Naik taraf PRO", search: "Cari produk, laporan, atau insight...", dark: "Mode gelap", light: "Mode terang", export: "Eksport", owner: "Pemilik", logout: "Keluar", language: "Bahasa", expired: "Tamat tempoh", free: "Percuma" },
};

const mobileKeys: TabKey[] = ["overview", "marketplace", "trend", "ai", "reports"];

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
  const [darkMode, setDarkMode] = useState(false);
  const [locale, setLocale] = useState<Locale>("id");

  useEffect(() => {
    const saved = normalizeLocale(window.localStorage.getItem("untungin_locale"));
    setLocale(saved);
    document.documentElement.lang = localeTag(saved);
  }, []);

  const navGroups = NAV[locale];
  const navItems = useMemo(() => navGroups.flatMap((group) => group.items), [navGroups]);
  const current = META[locale][activeTab] ?? META[locale].overview;
  const copy = UI[locale];
  const planLabel = isPro ? "PRO" : proExpired ? copy.expired : copy.free;
  const today = new Date().toLocaleDateString(localeTag(locale), { day: "2-digit", month: "short", year: "numeric" });

  function changeLocale(value: Locale) {
    const nextLocale = normalizeLocale(value);
    setLocale(nextLocale);
    window.localStorage.setItem("untungin_locale", nextLocale);
    document.documentElement.lang = localeTag(nextLocale);
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: nextLocale }));
  }

  return <main className={darkMode ? "dark-preview" : ""} style={{ minHeight: "100vh", color: darkMode ? "#e5e7eb" : "#111827", background: darkMode ? "#020617" : "#f3f6fb", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", overflowX: "hidden" }}>
    <style>{`
      * { box-sizing: border-box; }
      html, body { overflow-x: hidden; }
      button, label, select { transition: 160ms ease; }
      button:hover, label:hover { transform: translateY(-1px); filter: brightness(1.02); }
      input::placeholder, textarea::placeholder { color: #98a2b3; }
      .sidebar-scroll::-webkit-scrollbar, .mobile-nav::-webkit-scrollbar { height: 7px; width: 7px; }
      .sidebar-scroll::-webkit-scrollbar-thumb, .mobile-nav::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.18); border-radius: 999px; }
      .dark-preview .shell-panel, .dark-preview .topbar, .dark-preview .search-shell, .dark-preview .language-select { background: rgba(15,23,42,0.78) !important; border-color: rgba(148,163,184,0.18) !important; }
      .dark-preview .shell-text-muted { color: #94a3b8 !important; }
      .dark-preview .search-input, .dark-preview .language-select { color: #e2e8f0 !important; }
      .dark-preview .nav-cta-card { background: rgba(15,23,42,0.72) !important; border-color: rgba(148,163,184,0.18) !important; }
      .dark-preview .nav-selected { background: rgba(255,255,255,0.04) !important; }
      .app-shell { display: grid; grid-template-columns: 258px minmax(0, 1fr); min-height: 100vh; }
      .content-shell { min-width: 0; overflow-x: hidden; }
      .topbar-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: flex-end; min-width: 0; }
      .search-shell { display: flex; align-items: center; gap: 10px; min-width: min(280px, 100%); padding: 0 12px; border-radius: 16px; border: 1px solid rgba(15,23,42,0.08); background: rgba(255,255,255,0.86); box-shadow: 0 8px 24px rgba(15,23,42,0.04); }
      .search-input { border: 0; outline: none; background: transparent; width: 100%; color: #111827; font-size: 14px; font-weight: 600; padding: 10px 0; }
      .language-select { border: 1px solid rgba(15,23,42,0.08); outline: none; border-radius: 15px; background: #fff; color: #111827; padding: 10px 11px; font-weight: 900; cursor: pointer; }
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
      @media (max-width: 1320px) { .search-shell { min-width: 260px; } }
      @media (max-width: 1180px) { .app-shell { grid-template-columns: 1fr !important; } .sidebar { display: none !important; } .mobile-nav { display: flex !important; } .content-shell { padding: 14px !important; padding-bottom: 104px !important; } }
      @media (max-width: 900px) { .topbar { grid-template-columns: 1fr !important; } .topbar-actions { justify-content: flex-start !important; } }
      @media (max-width: 720px) { .topbar { padding: 14px !important; border-radius: 22px !important; } .topbar-title { font-size: 19px !important; } .topbar-actions { display: grid !important; grid-template-columns: 1fr 1fr; width: 100%; } .topbar-actions .search-shell { grid-column: 1 / -1; min-width: 100%; } .topbar-actions .full-span { grid-column: 1 / -1; } .content-shell { padding: 12px !important; } }
      @media (max-width: 520px) { .topbar-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); } .mobile-nav { left: 8px !important; right: 8px !important; bottom: 8px !important; } }
    `}</style>
    <div className="app-shell">
      <aside className="sidebar shell-panel" style={{ position: "sticky", top: 0, height: "100vh", padding: 12, background: "rgba(255,255,255,0.86)", borderRight: "1px solid rgba(15,23,42,0.08)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 6px 14px", borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#0f766e,#14b8a6)", color: "white", fontWeight: 950, boxShadow: "0 16px 30px rgba(15,118,110,0.24)" }}>U</div>
          <div><strong style={{ fontSize: 16, letterSpacing: -0.3 }}>Untungin.ai</strong><div className="shell-text-muted" style={{ color: "#667085", fontSize: 12, marginTop: 2 }}>{copy.system}</div></div>
        </div>

        <div style={{ padding: 10, borderRadius: 16, background: "linear-gradient(135deg,#0f172a,#134e4a)", color: "white", boxShadow: "0 18px 45px rgba(15,23,42,0.16)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><span style={{ fontSize: 12, color: "#cbd5e1" }}>{copy.workspace}</span><Badge label={planLabel} tone={isPro ? "success" : proExpired ? "danger" : "warning"} /></div>
          <strong style={{ display: "block", marginTop: 6 }}>{copy.mainStore}</strong>
          <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>{copy.channels}</div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><strong>{copy.scalePro}</strong><span style={{ fontSize: 12, color: "#667085" }}>AI + Team</span></div>
          <p style={{ margin: "8px 0 12px", color: "#667085", fontSize: 12, lineHeight: 1.55 }}>{copy.proHelper}</p>
          <button onClick={onUpgrade} style={{ ...ctaButtonStyle, width: "100%" }}>{isPro ? copy.managePlan : copy.upgrade}</button>
        </div>
      </aside>

      <section className="content-shell" style={{ padding: 18, minWidth: 0, width: "100%" }}>
        <div style={{ maxWidth: 1500, margin: "0 auto", width: "100%" }}>
          <div className="topbar" style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.90)", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 22, padding: "12px 14px", marginBottom: 14, backdropFilter: "blur(18px)", boxShadow: "0 18px 55px rgba(15,23,42,0.06)" }}>
            <div style={{ minWidth: 0 }}>
              <div className="shell-text-muted" style={{ color: "#667085", fontSize: 12, fontWeight: 850, letterSpacing: 0.3, textTransform: "uppercase" }}>{current.eyebrow}</div>
              <strong className="topbar-title">{current.title}</strong>
              <div className="shell-text-muted" style={{ color: "#667085", fontSize: 13, marginTop: 4 }}>{current.subtitle} {today}</div>
            </div>

            <div className="topbar-actions">
              <div className="search-shell full-span">
                <span aria-hidden="true" style={{ color: "#98a2b3", fontSize: 14 }}>⌕</span>
                <input className="search-input" type="text" placeholder={copy.search} readOnly />
              </div>
              <select className="language-select" aria-label={copy.language} value={locale} onChange={(event) => changeLocale(event.target.value as Locale)}>
                {LOCALES.map((item) => <option key={item.key} value={item.key}>{item.short}</option>)}
              </select>
              <button type="button" aria-label="Notifications" style={{ ...ghostButtonStyle, padding: "9px 11px" }}><span className="icon-only">🔔</span></button>
              <button onClick={() => setDarkMode((value) => !value)} style={{ ...ghostButtonStyle, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span className="icon-only">{darkMode ? "☀" : "☾"}</span><span>{darkMode ? copy.light : copy.dark}</span></button>
              <button onClick={onExport} style={ghostButtonStyle}>{copy.export}</button>
              {!isPro && <button onClick={onUpgrade} style={ctaButtonStyle}>{copy.upgrade}</button>}
              <button type="button" style={{ ...ghostButtonStyle, display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 11px" }}><span style={{ width: 28, height: 28, borderRadius: 999, display: "grid", placeItems: "center", background: "#0f172a", color: "#ffffff", fontWeight: 900, fontSize: 12 }}>TA</span><span>{copy.owner}</span></button>
              <button onClick={onLogout} style={{ ...ghostButtonStyle, color: "#b42318", background: "#fff7f7", borderColor: "#fecaca" }}>{copy.logout}</button>
            </div>
          </div>
          {children}
        </div>
      </section>
    </div>

    <nav className="mobile-nav" style={{ position: "fixed", left: 12, right: 12, bottom: 12, zIndex: 30, gap: 8, overflowX: "auto", padding: 8, borderRadius: 22, background: "rgba(255,255,255,0.94)", border: "1px solid rgba(15,23,42,0.10)", boxShadow: "0 18px 50px rgba(15,23,42,0.16)", backdropFilter: "blur(18px)" }}>
      {mobileKeys.map((key) => {
        const item = navItems.find((entry) => entry.key === key);
        if (!item) return null;
        return <button key={item.key} className={`nav-mini-button ${activeTab === item.key ? "active" : ""}`} onClick={() => onTabChange(item.key)}>{item.label}</button>;
      })}
    </nav>
  </main>;
}
