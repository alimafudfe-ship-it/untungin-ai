import type React from "react";
import { compactMoney, money } from "@/lib/dashboard/format";
import { Badge, ctaButtonStyle, ghostButtonStyle, Sparkline } from "./ui";

export function Hero({ netCash, totalRevenue, inventoryValue, sparklineData, onAddProduct, onAddCashflow, syncing, onCSVUpload }: { netCash: number; totalRevenue: number; inventoryValue: number; sparklineData: number[]; onAddProduct: () => void; onAddCashflow: () => void; syncing: boolean; onCSVUpload: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  const cashStatus = netCash >= 0 ? "Cashflow sehat" : "Cashflow perlu tindakan";
  return <header className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 24, alignItems: "stretch", marginBottom: 18, border: "1px solid rgba(255,255,255,0.18)", borderRadius: 32, padding: 28, background: "linear-gradient(135deg,#071313 0%,#0f172a 45%,#0f766e 135%)", color: "white", boxShadow: "0 30px 90px rgba(15,23,42,0.18)", overflow: "hidden", position: "relative" }}>
    <div style={{ position: "absolute", right: -110, top: -120, width: 340, height: 340, borderRadius: 999, background: "rgba(20,184,166,0.20)", filter: "blur(2px)" }} />
    <div style={{ position: "relative", zIndex: 1 }}>
      <Badge label="Built for Indonesian marketplace sellers" tone="success" />
      <h1 className="hero-title" style={{ fontSize: 54, lineHeight: 1.02, letterSpacing: -2.4, margin: "16px 0 12px", maxWidth: 850 }}>Profit jelas, stok aman, keputusan jualan lebih cepat.</h1>
      <p style={{ color: "#d0d5dd", fontSize: 17, lineHeight: 1.75, maxWidth: 790 }}>Dashboard operasional untuk seller Shopee, Tokopedia, TikTok Shop, dan reseller Indonesia: hitung HPP, fee admin, iklan, stok, cashflow, sampai rekomendasi tindakan harian.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
        <button onClick={onAddProduct} style={{ ...ctaButtonStyle, background: "linear-gradient(135deg,#ffffff,#e6fffb)", color: "#0f172a", boxShadow: "0 18px 40px rgba(255,255,255,0.12)" }}>Tambah produk</button>
        <button onClick={onAddCashflow} style={{ ...ghostButtonStyle, background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.20)", boxShadow: "none" }}>Catat cashflow</button>
        <label style={{ ...ghostButtonStyle, display: "inline-flex", cursor: "pointer", background: "rgba(255,255,255,0.08)", color: "white", borderColor: "rgba(255,255,255,0.20)", boxShadow: "none" }}>{syncing ? "Mengimpor..." : "Import CSV marketplace"}<input type="file" accept=".csv" onChange={onCSVUpload} style={{ display: "none" }} /></label>
      </div>
      <div className="three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10, marginTop: 24, maxWidth: 780 }}>
        {["Fee admin & voucher", "Stok kritis", "Report PDF/CSV"].map((item) => <div key={item} style={{ border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: 12, color: "#e2e8f0", fontWeight: 750 }}>{item}</div>)}
      </div>
    </div>
    <div style={{ position: "relative", zIndex: 1, display: "grid", gap: 12 }}>
      <div style={{ padding: 22, borderRadius: 26, background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.16)", backdropFilter: "blur(16px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}><p style={{ margin: 0, color: "#d0d5dd" }}>Cashflow bersih</p><Badge label={cashStatus} tone={netCash >= 0 ? "success" : "danger"} /></div>
        <h2 style={{ fontSize: 40, margin: "8px 0", color: netCash >= 0 ? "#ffffff" : "#fecaca", letterSpacing: -1.2 }}>{money(netCash)}</h2>
        <Sparkline data={sparklineData} />
        <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <div style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.08)" }}><small style={{ color: "#d0d5dd" }}>Omzet</small><br /><strong>{compactMoney(totalRevenue)}</strong></div>
          <div style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.08)" }}><small style={{ color: "#d0d5dd" }}>Modal di stok</small><br /><strong>{compactMoney(inventoryValue)}</strong></div>
        </div>
      </div>
      <div style={{ padding: 18, borderRadius: 22, background: "rgba(255,255,255,0.92)", color: "#101828", border: "1px solid rgba(255,255,255,0.20)" }}>
        <strong>Market mode Indonesia</strong>
        <p style={{ margin: "8px 0 0", color: "#667085", lineHeight: 1.65, fontSize: 14 }}>Optimasi untuk seller dengan COD, promo tanggal kembar, biaya admin marketplace, bundling, dan restock cepat.</p>
      </div>
    </div>
  </header>;
}
