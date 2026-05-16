import type React from "react";
import type { ImportPreview } from "@/lib/dashboard/marketplaceImport";
import { compactMoney, money, percent } from "@/lib/dashboard/format";
import { Badge, ctaButtonStyle, ghostButtonStyle, Progress } from "@/components/dashboard/ui";

type Props = {
  preview: ImportPreview | null;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function MappingRow({ label, header, confidence, costImpact }: { label: string; header: string | null; confidence: number; costImpact?: string }) {
  const tone = confidence >= 85 ? "success" : confidence >= 65 ? "warning" : "muted";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 80px", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #e2e8f0" }}>
      <strong style={{ fontSize: 13 }}>{label}</strong>
      <span style={{ color: header ? "#0f172a" : "#94a3b8", fontSize: 13 }}>{header || "Tidak terdeteksi"}{costImpact === "buyer_paid" ? " · bukan beban seller" : costImpact === "seller_cost" ? " · beban seller" : ""}</span>
      <Badge label={header ? `${confidence}%` : "-"} tone={tone as any} />
    </div>
  );
}

export function ImportPreviewModal({ preview, loading, onCancel, onConfirm }: Props) {
  if (!preview) return null;
  const rows = preview.rows.slice(0, 5);
  const costMappings = preview.mappings.filter((item) => item.costImpact || item.required || item.header).slice(0, 14);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.58)", display: "grid", placeItems: "center", padding: 18 }}>
      <section style={{ width: "min(1120px, 100%)", maxHeight: "92vh", overflow: "auto", borderRadius: 28, background: "#ffffff", border: "1px solid #dbe3ef", boxShadow: "0 30px 90px rgba(15,23,42,0.35)" }}>
        <div style={{ padding: 24, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <Badge label="v11 Auto Mapping Preview" tone="success" />
            <h2 style={{ margin: "12px 0 6px", fontSize: 30, letterSpacing: -0.8 }}>Cek hasil mapping sebelum import</h2>
            <p style={{ color: "#64748b", margin: 0, lineHeight: 1.65 }}>Sistem membaca header CSV marketplace, memisahkan fee admin, voucher, ongkir, pajak, iklan, dan settlement sebelum masuk database.</p>
          </div>
          <div style={{ minWidth: 220 }}>
            <strong>{preview.detectedMarketplace}</strong>
            <div style={{ color: "#64748b", fontSize: 13, margin: "4px 0 8px" }}>Confidence {preview.confidence}%</div>
            <Progress value={preview.confidence} />
          </div>
        </div>

        <div style={{ padding: 24, display: "grid", gap: 18 }}>
          <div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
            <div style={miniCard}><small>Rows valid</small><strong>{preview.summary.validRows}/{preview.summary.totalRows}</strong></div>
            <div style={miniCard}><small>Omzet preview</small><strong>{compactMoney(preview.summary.grossRevenue)}</strong></div>
            <div style={miniCard}><small>Profit estimasi</small><strong style={{ color: preview.summary.estimatedProfit >= 0 ? "#0f766e" : "#dc2626" }}>{money(preview.summary.estimatedProfit)}</strong></div>
            <div style={miniCard}><small>Biaya seller</small><strong>{money(preview.summary.sellerCosts)}</strong></div>
            <div style={miniCard}><small>Margin avg</small><strong>{percent(preview.summary.avgMargin)}</strong></div>
          </div>

          {preview.warnings.length > 0 && (
            <div style={{ padding: 16, borderRadius: 18, background: "#fffbeb", border: "1px solid #fde68a" }}>
              <Badge label="Perlu dicek" tone="warning" />
              <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "#92400e", lineHeight: 1.65 }}>
                {preview.warnings.map((warning, index) => <li key={index}>{warning}</li>)}
              </ul>
            </div>
          )}

          <div className="main-grid" style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 18 }}>
            <div style={{ padding: 18, borderRadius: 22, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <Badge label="Auto column mapping" tone="blue" />
              <h3 style={{ margin: "10px 0" }}>Kolom yang dikenali</h3>
              <div>{costMappings.map((item) => <MappingRow key={item.field} label={item.label} header={item.header} confidence={item.confidence} costImpact={item.costImpact} />)}</div>
            </div>
            <div style={{ padding: 18, borderRadius: 22, border: "1px solid #e2e8f0", background: "#ffffff" }}>
              <Badge label="Preview import" tone="success" />
              <h3 style={{ margin: "10px 0" }}>5 baris pertama</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead><tr style={{ color: "#64748b", textAlign: "left" }}><th style={th}>Produk</th><th style={th}>Harga</th><th style={th}>Qty</th><th style={th}>Biaya</th><th style={th}>Profit</th><th style={th}>Margin</th></tr></thead>
                  <tbody>{rows.map((row, index) => <tr key={`${row.name}-${index}`}><td style={td}><strong>{row.name}</strong><div style={{ color: "#64748b" }}>{row.marketplace}</div></td><td style={td}>{money(row.selling_price)}</td><td style={td}>{row.quantity_sold}</td><td style={td}>{money(row.other_cost)}</td><td style={{ ...td, color: row.profit >= 0 ? "#0f766e" : "#dc2626", fontWeight: 900 }}>{money(row.profit)}</td><td style={td}>{percent(row.margin)}</td></tr>)}</tbody>
                </table>
              </div>
              <p style={{ color: "#64748b", fontSize: 13, lineHeight: 1.65 }}>Ongkir pembeli tidak otomatis dianggap beban. Yang dihitung sebagai biaya seller hanya admin, layanan, komisi, voucher seller, subsidi ongkir seller, pajak, iklan, dan affiliate.</p>
            </div>
          </div>
        </div>

        <div style={{ padding: 20, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={onCancel} disabled={loading} style={ghostButtonStyle}>Batal</button>
          <button type="button" onClick={onConfirm} disabled={loading || preview.summary.validRows === 0} style={ctaButtonStyle}>{loading ? "Mengimpor..." : "Confirm import ke dashboard"}</button>
        </div>
      </section>
    </div>
  );
}

const miniCard: React.CSSProperties = { padding: 16, borderRadius: 18, background: "#f8fafc", border: "1px solid #e2e8f0", display: "grid", gap: 6 };
const th: React.CSSProperties = { padding: "10px 8px", borderBottom: "1px solid #e2e8f0" };
const td: React.CSSProperties = { padding: "12px 8px", borderBottom: "1px solid #e2e8f0", verticalAlign: "top" };
