import type { DashboardMetrics, Expense, Product } from "@/types/dashboard";
import { buildForecast, buildRecommendations } from "@/lib/dashboard/recommendations";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle, Progress, StatCard } from "./ui";
import { ForecastChartCard, LineChartCard } from "./Charts";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function LiveChartsPanel({ products, expenses, metrics }: { products: Product[]; expenses: Expense[]; metrics: DashboardMetrics }) {
  const daily = buildForecast(products, expenses, 14).map((item, index) => ({
    label: `H+${index + 1}`,
    value: item.revenue,
    secondary: item.expenses,
  }));
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
  const critical = products.filter((item) => item.stockInitial > 0 && (item.stockRemaining <= 5 || item.stockRemaining <= item.stockInitial * 0.15));
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

export function MarketplaceApiPanel({ products }: { products: Product[] }) {
  const channels = [
    { name: "Shopee", status: "OAuth ready", route: "/api/marketplace/shopee/connect" },
    { name: "Tokopedia", status: "OAuth ready", route: "/api/marketplace/tokopedia/connect" },
    { name: "TikTok Shop", status: "Planned", route: "Phase berikutnya" },
    { name: "Lazada", status: "Planned", route: "Phase berikutnya" },
  ];
  const marketplaceCount = new Set(products.map((item) => item.marketplace || "Manual")).size;
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ ...cardStyle, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div><Badge label="Marketplace API" tone="blue" /><h2 style={{ margin: "10px 0 4px" }}>Shopee & Tokopedia connector foundation</h2><p style={{ color: "#64748b", margin: 0 }}>OAuth route dan connection table disiapkan. Isi env partner key/secret saat sudah mendapat akses resmi marketplace.</p></div>
        <Badge label={`${marketplaceCount} channels`} tone="success" />
      </section>
      <section className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {channels.map((item) => <div key={item.name} style={cardStyle}><Badge label={item.status} tone={item.status.includes("ready") ? "success" : "muted"} /><h3>{item.name}</h3><p style={{ color: "#64748b" }}>{item.route}</p><button style={ghostButtonStyle}>Connect</button></div>)}
      </section>
    </div>
  );
}

export function FinanceChatPanel({ messages, question, loading, onQuestionChange, onAsk }: { messages: ChatMessage[]; question: string; loading: boolean; onQuestionChange: (value: string) => void; onAsk: () => void }) {
  return (
    <section className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 18 }}>
      <div style={cardStyle}><Badge label="AI Finance Chat" tone="success" /><h2>Tanya CFO digital</h2><p style={{ color: "#64748b", lineHeight: 1.7 }}>Chat membaca konteks omzet, profit, expenses, stok, dan forecast. Bisa memakai OpenAI jika env OPENAI_API_KEY tersedia, fallback ke rules engine.</p><textarea value={question} onChange={(e) => onQuestionChange(e.target.value)} rows={7} placeholder="Contoh: minggu ini produk apa yang harus saya scale dan biaya apa yang harus ditekan?" style={{ width: "100%", padding: 14, borderRadius: 14, border: "1px solid #dbe3ef", resize: "vertical" }} /><button onClick={onAsk} disabled={loading} style={{ ...ctaButtonStyle, width: "100%", marginTop: 12, opacity: loading ? 0.7 : 1 }}>{loading ? "Menganalisis..." : "Ask AI CFO"}</button></div>
      <div style={cardStyle}><Badge label="Conversation" tone="blue" /><div style={{ display: "grid", gap: 12, marginTop: 14 }}>{messages.map((msg, index) => <div key={index} style={{ padding: 14, borderRadius: 16, background: msg.role === "assistant" ? "#f8fafc" : "#ecfdf5", border: "1px solid #e2e8f0" }}><strong>{msg.role === "assistant" ? "AI CFO" : "Anda"}</strong><p style={{ whiteSpace: "pre-wrap", marginBottom: 0, color: "#334155", lineHeight: 1.7 }}>{msg.content}</p></div>)}</div></div>
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
      <p style={{ color: "#64748b", lineHeight: 1.7 }}>v10 memakai pendekatan multi-provider: manual transfer untuk validasi market awal, Xendit sebagai jalur berikutnya, dan Midtrans hanya opsional. Growth tidak boleh berhenti karena gateway ditolak. ENV aman: PAYMENT_PROVIDER=manual dan NEXT_PUBLIC_PAYMENT_PROVIDER=manual.</p>
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
