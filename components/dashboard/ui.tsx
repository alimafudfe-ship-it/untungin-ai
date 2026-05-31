"use client";

import type React from "react";
import { useEffect, useState, useMemo } from "react";
import type { DashboardMetrics, Expense, Product, Tone } from "@/types/dashboard";
import { buildForecast } from "@/lib/dashboard/recommendations";
import { clamp, compactMoney, money, percent } from "@/lib/dashboard/format";
import { ForecastChartCard, LineChartCard } from "./Charts";

// ==========================================
// 1. STYLES & CONFIGURATIONS
// ==========================================

export const colors = {
  ink: "#101828",
  muted: "#667085",
  line: "rgba(16,24,40,0.10)",
  soft: "#f8fafc",
  brand: "#0f766e",
  brand2: "#14b8a6",
  gold: "#f59e0b",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 14,
  border: "1px solid rgba(16,24,40,0.12)",
  background: "rgba(255,255,255,0.92)",
  color: colors.ink,
  outline: "none",
  fontSize: 14,
  boxShadow: "0 1px 0 rgba(16,24,40,0.02)",
};

export const cardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.92))",
  border: "1px solid rgba(16,24,40,0.09)",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 16px 52px rgba(16,24,40,0.07)",
};

export const ctaButtonStyle: React.CSSProperties = {
  padding: "10px 15px",
  background: "linear-gradient(135deg,#0f766e,#14b8a6)",
  color: "#ffffff",
  border: "0",
  borderRadius: 14,
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 14,
  boxShadow: "0 14px 32px rgba(15,118,110,0.24)",
};

export const ghostButtonStyle: React.CSSProperties = {
  padding: "9px 12px",
  background: "rgba(255,255,255,0.86)",
  color: colors.ink,
  border: "1px solid rgba(16,24,40,0.12)",
  borderRadius: 13,
  cursor: "pointer",
  fontWeight: 800,
  boxShadow: "0 8px 24px rgba(16,24,40,0.04)",
};

// ==========================================
// 2. CORE UI COMPONENTS (With Safety Fallback)
// ==========================================

function tonePalette(tone: any) {
  const mapping: Record<string, { color: string; bg: string; border: string }> = {
    success: { color: "#047857", bg: "#ecfdf3", border: "#a7f3d0" },
    warning: { color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    danger: { color: "#b42318", bg: "#fff1f1", border: "#fecaca" },
    blue: { color: "#175cd3", bg: "#eff6ff", border: "#bfdbfe" },
    neutral: { color: colors.ink, bg: "#f8fafc", border: "#e2e8f0" },
    muted: { color: colors.muted, bg: "#f8fafc", border: "#e2e8f0" },
    shopee: { color: "#ea580c", bg: "#fff7ed", border: "#ffedd5" },
    tokopedia: { color: "#16a34a", bg: "#f0fdf4", border: "#dcfce7" },
    tiktok: { color: "#000000", bg: "#f3f4f6", border: "#e5e7eb" }
  };

  // Jika parameter tone null, undefined, atau tidak bertipe string, paksa ke 'neutral'
  if (!tone || typeof tone !== "string") {
    return mapping["neutral"];
  }

  // Cari di mapping, jika tidak ada (misal ada string 'aktif' atau 'proses'), lempar ke 'neutral'
  return mapping[tone.toLowerCase()] || mapping["neutral"];
}

export function Badge({ label, tone = "muted" }: { label: string; tone?: any }) {
  // Ambil palet dengan jaminan tidak akan menghasilkan undefined
  const palette = tonePalette(tone);
  
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 999,
        padding: "5px 9px",
        color: palette?.color || "#101828",
        background: palette?.bg || "#f8fafc",
        border: `1px solid ${palette?.border || "#e2e8f0"}`,
        fontSize: 12,
        fontWeight: 850,
        letterSpacing: 0.1,
      }}
    >
      {label}
    </span>
  );
}

export function Progress({ value }: { value: number }) {
  const width = clamp(value, 0, 100);
  return (
    <div style={{ height: 8, borderRadius: 999, background: "#edf2f7", overflow: "hidden" }}>
      <div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#0f766e,#14b8a6,#f59e0b)" }} />
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
  tone = "success",
  delta,
  deltaTone = "muted",
}: {
  label: string;
  value: React.ReactNode;
  helper: string;
  tone?: Tone;
  delta?: string;
  deltaTone?: Tone;
}) {
  const color = tone === "danger" ? "#b42318" : tone === "warning" ? "#b45309" : tone === "blue" ? "#175cd3" : tone === "neutral" ? colors.ink : colors.brand;
  const deltaPalette = tonePalette(deltaTone);
  return (
    <div style={{ ...cardStyle, position: "relative", overflow: "hidden", minWidth: 0 }}>
      <div style={{ position: "absolute", right: -28, top: -32, width: 105, height: 105, borderRadius: 999, background: `${color}12` }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
          <p style={{ margin: 0, color: colors.muted, fontSize: 13, fontWeight: 750 }}>{label}</p>
          {delta ? <span style={{ display: "inline-flex", alignItems: "center", borderRadius: 999, padding: "6px 9px", color: deltaPalette.color, background: deltaPalette.bg, border: `1px solid ${deltaPalette.border}`, fontSize: 11, fontWeight: 850 }}>{delta}</span> : null}
        </div>
        <h2 style={{ margin: "8px 0", color, fontSize: 27, letterSpacing: -0.9 }}>{value}</h2>
        <small style={{ color: colors.muted, lineHeight: 1.5 }}>{helper}</small>
      </div>
    </div>
  );
}

export function Sparkline({ data }: { data: number[] }) {
  const width = 260;
  const height = 72;
  const safeData = data.length > 1 ? data : [0, data[0] || 0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;
  const points = safeData.map((value, index) => `${(index / Math.max(safeData.length - 1, 1)) * width},${height - ((value - min) / range) * height}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height }}>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#99f6e4" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="10" points={points} strokeLinecap="round" strokeLinejoin="round" />
      <polyline fill="none" stroke="url(#spark)" strokeWidth="3.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ==========================================
// 3. TYPES & SUB-PANELS
// ==========================================

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function LiveChartsPanel({ products, expenses, metrics }: { products: Product[]; expenses: Expense[]; metrics: DashboardMetrics }) {
  const daily = useMemo(() => {
    return buildForecast(products, expenses, 14).map((item, index) => ({
      label: `H+${index + 1}`,
      value: item.revenue,
      secondary: item.expenses,
    }));
  }, [products, expenses]);

  return (
    <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 18 }}>
      <LineChartCard key={`realtime-revenue-expense-v4-${daily.length}-${metrics.totalRevenue}-${metrics.totalExpenses}`} title="Realtime Revenue vs Expense" subtitle="Update otomatis dari Supabase Realtime" data={daily} valueLabel="Revenue" secondaryLabel="Expense" maxTicks={4} />
      <div style={{ ...cardStyle, background: "linear-gradient(180deg,#ffffff,#f8fffd)", borderColor: "rgba(15,118,110,0.16)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><Badge label="Live Dashboard" tone="success" /><Badge label="Realtime ON" tone="blue" /></div>
        <h3 style={{ margin: "14px 0 4px" }}>Kondisi sekarang</h3>
        <p style={{ margin: "0 0 16px", color: "#64748b", lineHeight: 1.6 }}>Ringkasan operasional untuk keputusan harian owner toko.</p>
        <div style={{ display: "grid", gap: 14 }}>
          <div><small>Net cash <b style={{ float: "right" }}>{money(metrics.netCash)}</b></small><Progress value={metrics.totalRevenue > 0 ? (metrics.netCash / metrics.totalRevenue) * 100 : 0} /></div>
          <div><small>Expense pressure <b style={{ float: "right" }}>{compactMoney(metrics.totalExpenses)}</b></small><Progress value={metrics.totalProfit > 0 ? (metrics.totalExpenses / metrics.totalProfit) * 100 : 0} /></div>
          <div><small>Inventory locked <b style={{ float: "right" }}>{compactMoney(metrics.inventoryValue)}</b></small><Progress value={100} /></div>
        </div>
        <div style={{ marginTop: 18, padding: 14, borderRadius: 18, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontWeight: 800 }}>Prioritas: scale produk margin sehat, tekan biaya iklan yang tidak balik modal.</div>
      </div>
    </section>
  );
}

export function TeamAccessPanel({ userEmail }: { userEmail: string | null }) {
  const roles = [
    ["Owner", "Akses penuh billing, data, export, dan team."],
    ["Finance", "Kelola cashflow, expense, reports, dan export."],
    ["Warehouse", "Kelola inventory, stok masuk, dan stok opname."],
    ["Staff", "Input sales dan produk tanpa akses billing."],
  ];
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ ...cardStyle, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div><Badge label="Auth Multi-user" tone="success" /><h2 style={{ margin: "10px 0 4px" }}>Workspace team access</h2><p style={{ color: "#64748b", margin: 0 }}>Foundation multi-user sudah disiapkan: organizations, memberships, invitations, dan role-based access.</p></div>
        <button style={ctaButtonStyle}>Invite team member</button>
      </section>
      <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {roles.map(([role, detail]) => <div key={role} style={cardStyle}><Badge label={role} tone={role === "Owner" ? "success" : "blue"} /><p style={{ color: "#64748b", lineHeight: 1.6 }}>{detail}</p></div>)}
      </section>
      <section style={cardStyle}><Badge label="Current session" tone="blue" /><h3>{userEmail || "Demo user"}</h3><p style={{ color: "#64748b" }}>Saat connector invitation diaktifkan, user dapat mengundang admin gudang, finance, dan partner tanpa membagikan akun utama.</p></section>
    </div>
  );
}

export function AutomationPanel({ products, metrics }: { products: Product[]; metrics: DashboardMetrics }) {
  const critical = useMemo(() => products.filter((item) => item.stockInitial > 0 && (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15)), [products]);
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ ...cardStyle, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div><Badge label="Automation Center" tone="success" /><h2 style={{ margin: "10px 0 4px" }}>Daily report & WhatsApp stock alert</h2><p style={{ color: "#64748b", margin: 0 }}>Endpoint cron dan WhatsApp alert sudah disiapkan untuk Vercel Cron + WhatsApp Cloud API.</p></div>
        <button style={ctaButtonStyle}>Test daily report</button>
      </section>
      <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        <StatCard label="Daily report" value="08:00" helper="Ringkasan profit, cashflow, stok" tone="blue" />
        <StatCard label="Stok kritis" value={critical.length} helper="Trigger WhatsApp alert" tone={critical.length ? "warning" : "success"} />
        <StatCard label="Cashflow alert" value={metrics.netCash < 0 ? "ON" : "Standby"} helper="Notif saat net cash negatif" tone={metrics.netCash < 0 ? "danger" : "success"} />
        <StatCard label="Forecast alert" value="30D" helper="Prediksi risiko 30 hari" tone="neutral" />
      </section>
      <section style={cardStyle}><Badge label="WhatsApp Alert Preview" tone="warning" /><h3>Pesan otomatis</h3><p style={{ color: "#475569", lineHeight: 1.7 }}>⚠️ Stok kritis: {critical[0]?.name || "Tidak ada stok kritis"}. Cashflow bersih saat ini {money(metrics.netCash)}. Buka Untungin.ai untuk action plan.</p></section>
    </div>
  );
}

export function MarketplaceApiPanel({ products, userId, workspaceId }: { products: Product[]; userId?: string | null; workspaceId?: string | null }) {
  const [tiktokConnected, setTiktokConnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const marketplaceStatus = url.searchParams.get("marketplace");

    if (marketplaceStatus?.includes("tiktok_connected") || marketplaceStatus === "tiktok_already_connected") {
      localStorage.setItem("tiktok_connected", "1");
      setTiktokConnected(true);
      return;
    }

    if (localStorage.getItem("tiktok_connected") === "1") {
      setTiktokConnected(true);
    }
  }, []);

  const tiktokParams = useMemo(() => {
    const params = new URLSearchParams();
    if (userId) params.append("user_id", userId);
    if (workspaceId) params.append("workspace_id", workspaceId);
    return params;
  }, [userId, workspaceId]);

  const tiktokRoute = `/api/marketplace/tiktok/connect?${tiktokParams.toString()}`;
  const tiktokReviewRoute = `/api/marketplace/tiktok/review-data?${tiktokParams.toString()}`;
  
  const createTikTokReviewData = async () => {
    try {
      const response = await fetch("/api/marketplace/tiktok/review-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, workspace_id: workspaceId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || "Gagal membuat data review TikTok Shop.");
      alert(`Data review TikTok Shop dibuat. Product ID: ${data.productExternalIds?.join(", ")} | Order ID: ${data.orderExternalIds?.join(", ")}`);
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal membuat data review TikTok Shop.");
    }
  };

  const channels = [
    { name: "Shopee", status: "OAuth ready", route: "/api/marketplace/shopee/connect" },
    { name: "Tokopedia", status: "OAuth ready", route: "/api/marketplace/tokopedia/connect" },
    { name: "TikTok Shop", status: tiktokConnected ? "Connected" : "OAuth ready", route: tiktokRoute },
    { name: "Lazada", status: "Planned", route: "Phase berikutnya" },
  ];

  const marketplaceCount = useMemo(() => new Set(products.map((item) => item.marketplace || "Manual")).size, [products]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ ...cardStyle, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div><Badge label="Marketplace API" tone="blue" /><h2 style={{ margin: "10px 0 4px" }}>Shopee, Tokopedia & TikTok Shop connector foundation</h2><p style={{ color: "#64748b", margin: 0 }}>OAuth route dan connection table disiapkan. TikTok Shop Connect aktif dan membaca ENV dari Vercel.</p></div>
        <Badge label={`${marketplaceCount} channels`} tone="success" />
      </section>
      <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {channels.map((item) => (
          <div key={item.name} style={cardStyle}>
            <Badge label={item.status} tone={item.status.includes("ready") || item.status === "Connected" ? "success" : "muted"} />
            <h3>{item.name}</h3>
            <p style={{ color: "#64748b", wordBreak: "break-all" }}>{item.route}</p>
            {item.name === "TikTok Shop" && tiktokConnected ? (
              <button type="button" disabled style={{ ...ghostButtonStyle, opacity: 0.7, cursor: "default" }}>Connected</button>
            ) : item.route.startsWith("/api/") ? (
              <a href={item.route} style={{ ...ghostButtonStyle, display: "inline-flex", textDecoration: "none" }}>Connect</a>
            ) : (
              <button type="button" disabled style={{ ...ghostButtonStyle, opacity: 0.55, cursor: "not-allowed" }}>Connect</button>
            )}
          </div>
        ))}
      </section>
      <section style={cardStyle}>
        <Badge label="TikTok Go Live Review" tone="warning" />
        <h3 style={{ margin: "12px 0 6px" }}>Bukti backend data TikTok Shop</h3>
        <p style={{ color: "#64748b", lineHeight: 1.7, marginTop: 0 }}>Reviewer TikTok meminta order ID diawali 57/58 dan product ID diawali 17. Tombol ini membuat data review yang tersimpan di tabel products, orders/order_items, dan sales dengan marketplace=tiktok.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={createTikTokReviewData} style={ctaButtonStyle}>Buat data review TikTok</button>
          <a href={tiktokReviewRoute} target="_blank" rel="noreferrer" style={{ ...ghostButtonStyle, display: "inline-flex", textDecoration: "none" }}>Cek JSON backend</a>
        </div>
      </section>
    </div>
  );
}

export function FinanceChatPanel({ messages, question, loading, onQuestionChange, onAsk }: { messages: ChatMessage[]; question: string; loading: boolean; onQuestionChange: (value: string) => void; onAsk: () => void }) {
  return (
    <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 18 }}>
      <div style={cardStyle}>
        <Badge label="AI Finance Chat" tone="success" />
        <h2>Tanya CFO digital</h2>
        <p style={{ color: "#64748b", lineHeight: 1.7 }}>Chat membaca konteks omzet, profit, expenses, stok, dan forecast. Bisa memakai OpenAI jika env OPENAI_API_KEY tersedia, fallback ke rules engine.</p>
        <textarea value={question} onChange={(e) => onQuestionChange(e.target.value)} rows={7} placeholder="Contoh: minggu ini produk apa yang harus saya scale dan biaya apa yang harus ditekan?" style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid #dbe3ef", resize: "vertical" }} />
        <button onClick={onAsk} disabled={loading} style={{ ...ctaButtonStyle, width: "100%", marginTop: 12, opacity: loading ? 0.7 : 1 }}>{loading ? "Menganalisis..." : "Ask AI CFO"}</button>
      </div>
      <div style={cardStyle}>
        <Badge label="Conversation" tone="blue" />
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ padding: 14, borderRadius: 16, background: msg.role === "assistant" ? "#f8fafc" : "#ecfdf5", border: "1px solid #e2e8f0" }}>
              <strong>{msg.role === "assistant" ? "AI CFO" : "Anda"}</strong>
              <p style={{ whiteSpace: "pre-wrap", marginBottom: 0, color: "#334155", lineHeight: 1.7 }}>{msg.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MidtransSubscriptionPanel() {
  const providers = [
    ["Xendit", "Primary", "Invoice, VA, QRIS, e-wallet, dan subscription path. Cocok sebagai pengganti Midtrans ketika aktivasi ditolak."],
    ["Manual transfer", "Fallback", "Untuk early customer: upload bukti bayar, admin approve, lalu profile/workspace jadi PRO."],
    ["Midtrans", "Optional", "Tetap bisa dipakai jika akun nanti disetujui, tapi bukan blocking dependency."],
  ];
  return (
    <section style={cardStyle}>
      <Badge label="Payment Provider Strategy" tone="success" />
      <h2 style={{ margin: "10px 0 4px" }}>Billing tidak boleh berhenti karena satu gateway ditolak</h2>
      <p style={{ color: "#64748b", lineHeight: 1.7 }}>v11 tetap memakai pendekatan multi-provider: manual transfer untuk validasi market awal, Xendit sebagai jalur berikutnya, dan Midtrans hanya opsional. Growth tidak boleh berhenti karena gateway ditolak. ENV aman: PAYMENT_PROVIDER=manual dan NEXT_PUBLIC_PAYMENT_PROVIDER=manual.</p>
      <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 16 }}>
        {providers.map(([name, status, detail]) => (
          <div key={name} style={{ padding: 16, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Badge label={status} tone={status === "Primary" ? "success" : status === "Fallback" ? "warning" : "muted"} />
            <h3 style={{ margin: "12px 0 6px" }}>{name}</h3>
            <p style={{ color: "#64748b", lineHeight: 1.6, margin: 0 }}>{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// Tambahkan ini di bagian paling bawah file components/dashboard/ui.tsx
export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  onAction 
}: { 
  title: string; 
  description: string; 
  actionLabel?: string; 
  onAction?: () => void; 
}) {
  return (
    <div style={{ 
      ...cardStyle, 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: "40px 20px", 
      textAlign: "center",
      background: "rgba(255,255,255,0.5)",
      border: "1px dashed rgba(16,24,40,0.15)"
    }}>
      <div style={{ 
        width: 48, 
        height: 48, 
        borderRadius: 999, 
        background: "#f1f5f9", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        marginBottom: 16,
        fontSize: 20
      }}>
        📦
      </div>
      <h3 style={{ margin: "0 0 6px 0", color: colors.ink, fontSize: 16, fontWeight: 700 }}>{title}</h3>
      <p style={{ margin: "0 0 20px 0", color: colors.muted, fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>{description}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} style={ctaButtonStyle}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}