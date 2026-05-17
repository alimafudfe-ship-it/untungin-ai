import type { Product, ProductFilter } from "@/types/dashboard";
import { daysUntilOut, getHealth, getRestockRecommendation, getStockStatus, productDecision, recommendedPrice } from "@/lib/dashboard/calculations";
import { money, percent } from "@/lib/dashboard/format";
import { useDashboardLocale } from "@/lib/dashboard/i18n";
import { Badge, EmptyState, ghostButtonStyle, Progress } from "./ui";

const COPY = {
  id: { emptyTitle: "Belum ada produk", emptyDesc: "Tambahkan produk manual atau impor CSV untuk mulai membaca profit dan stok.", emptyShort: "Tambah produk atau impor CSV.", product: "Produk", marketplace: "Marketplace", price: "Harga", profit: "Profit", stock: "Stok", sold: "Terjual", estimate: "Estimasi", margin: "Margin", status: "Status", action: "Aksi", safePrice: "Harga aman", checkCsv: "Cek kolom Harga Jual/HPP di CSV", sell: "Jual", outIn: "Habis", days: "hari", checkMapping: "Cek mapping", delete: "Hapus", decision: "Keputusan", check: "Cek CSV", filters: { all: "Semua", loss: "Rugi", fix: "Optimasi", scale: "Scale", stock: "Stok" } },
  en: { emptyTitle: "No products yet", emptyDesc: "Add products manually or import CSV to start reading profit and inventory.", emptyShort: "Add products or import CSV.", product: "Product", marketplace: "Marketplace", price: "Price", profit: "Profit", stock: "Stock", sold: "Sold", estimate: "Estimate", margin: "Margin", status: "Status", action: "Action", safePrice: "Safe price", checkCsv: "Check Selling Price/COGS columns in CSV", sell: "Sell", outIn: "Out in", days: "days", checkMapping: "Check mapping", delete: "Delete", decision: "Decision", check: "Check CSV", filters: { all: "All", loss: "Loss", fix: "Optimize", scale: "Scale", stock: "Stock" } },
  ms: { emptyTitle: "Belum ada produk", emptyDesc: "Tambah produk manual atau import CSV untuk mula membaca profit dan stok.", emptyShort: "Tambah produk atau import CSV.", product: "Produk", marketplace: "Marketplace", price: "Harga", profit: "Profit", stock: "Stok", sold: "Terjual", estimate: "Anggaran", margin: "Margin", status: "Status", action: "Tindakan", safePrice: "Harga selamat", checkCsv: "Semak lajur Harga Jual/Kos dalam CSV", sell: "Jual", outIn: "Habis", days: "hari", checkMapping: "Semak mapping", delete: "Padam", decision: "Keputusan", check: "Semak CSV", filters: { all: "Semua", loss: "Rugi", fix: "Optimasi", scale: "Skala", stock: "Stok" } },
};

function translateProductDecision(text: string, locale: keyof typeof COPY) {
  if (locale === "id") return text;
  if (locale === "en") {
    return text
      .replace(/Aman/gi, "Safe")
      .replace(/Pantau stok/gi, "Watch stock")
      .replace(/Tahan restock/gi, "Hold restock")
      .replace(/Scale bertahap/gi, "Scale gradually")
      .replace(/Harga aman/gi, "Safe price")
      .replace(/Stop \/ evaluasi/gi, "Stop / review");
  }
  return text
    .replace(/Aman/gi, "Selamat")
    .replace(/Pantau stok/gi, "Pantau stok")
    .replace(/Tahan restock/gi, "Tahan restock")
    .replace(/Scale bertahap/gi, "Skala bertahap")
    .replace(/Harga aman/gi, "Harga selamat")
    .replace(/Stop \/ evaluasi/gi, "Henti / semak");
}

export function ProductTable({ products, mode = "product", onStock, onSale, onDelete }: { products: Product[]; mode?: "product" | "inventory"; onStock: (id: string) => void; onSale: (id: string) => void; onDelete: (id: string) => void }) {
  const locale = useDashboardLocale();
  const c = COPY[locale];
  if (products.length === 0) return <EmptyState title={c.emptyTitle} description={c.emptyDesc} />;
  const columns = [c.product, c.marketplace, c.price, c.profit, c.stock, c.sold, mode === "inventory" ? c.estimate : c.margin, c.status, c.action];
  return <div style={{ overflowX: "auto", borderRadius: 18, border: "1px solid #dbe3ef", background: "#ffffff" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}><thead><tr style={{ background: "#f8fafc", textAlign: "left" }}>{columns.map((head) => <th key={head} style={{ padding: "14px 16px", color: "#64748b", fontSize: 12, fontWeight: 800, textTransform: "uppercase", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{head}</th>)}</tr></thead><tbody>{products.map((item) => {
    const health = getHealth(item); const stock = getStockStatus(item); const dayLeft = daysUntilOut(item); const safePrice = recommendedPrice(item); const restock = getRestockRecommendation(item); const suspiciousMargin = Math.abs(item.margin) > 300 || (item.costPrice > 0 && item.sellingPrice > 0 && item.sellingPrice < item.costPrice * 0.25);
    return <tr key={item.id} style={{ borderBottom: "1px solid #eef2f7" }}><td style={{ padding: 16, minWidth: 230 }}><strong>{item.name}</strong><div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}><Badge label={translateProductDecision(health.label, locale)} tone={health.tone} /><Badge label={translateProductDecision(stock.label, locale)} tone={stock.tone} /></div><small style={{ display: "block", marginTop: 9, color: "#64748b" }}>{suspiciousMargin ? c.checkCsv : translateProductDecision(productDecision(item), locale)} · {c.safePrice} <b style={{ color: "#0f172a" }}>{money(safePrice)}</b></small></td><td style={{ padding: 16 }}><Badge label={item.marketplace || "Manual"} tone="blue" /></td><td style={{ padding: 16, whiteSpace: "nowrap" }}><small style={{ color: "#64748b" }}>{c.sell}</small><br /><strong>{money(item.sellingPrice)}</strong></td><td style={{ padding: 16, whiteSpace: "nowrap" }}><small style={{ color: "#64748b" }}>{c.profit}</small><br /><strong style={{ color: item.profit >= 0 ? "#0f766e" : "#b91c1c" }}>{money(item.profit)}</strong></td><td style={{ padding: 16, whiteSpace: "nowrap" }}><small style={{ color: "#64748b" }}>{c.stock}</small><br /><strong>{item.stockRemaining}</strong></td><td style={{ padding: 16, whiteSpace: "nowrap" }}><small style={{ color: "#64748b" }}>{c.sold}</small><br /><strong>{item.quantitySold}</strong></td><td style={{ padding: 16, minWidth: 140 }}>{mode === "inventory" ? <><small style={{ color: "#64748b" }}>{c.outIn}</small><br /><strong style={{ color: dayLeft !== null && dayLeft <= 7 ? "#b45309" : "#0f172a" }}>{dayLeft === null ? "-" : `${dayLeft} ${c.days}`}</strong></> : <><small style={{ color: "#64748b" }}>{c.margin}</small><br /><strong style={{ color: suspiciousMargin ? "#b45309" : "#0f172a" }}>{suspiciousMargin ? c.checkMapping : percent(item.margin)}</strong><div style={{ marginTop: 8 }}><Progress value={Math.max(0, Math.min(item.margin, 60)) / 60 * 100} /></div></>}</td><td style={{ padding: 16, minWidth: 130 }}><Badge label={translateProductDecision(restock, locale)} tone={restock.toLowerCase().includes("restock") ? "success" : "muted"} /></td><td style={{ padding: 16, minWidth: 160 }}><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button onClick={() => onStock(item.id)} style={{ ...ghostButtonStyle, padding: "8px 11px", fontSize: 12 }}>{c.stock}</button><button onClick={() => onSale(item.id)} style={{ ...ghostButtonStyle, padding: "8px 11px", fontSize: 12 }}>{c.sell}</button><button onClick={() => onDelete(item.id)} style={{ padding: "8px 11px", borderRadius: 12, border: "1px solid #fecaca", background: "#fff5f5", color: "#b91c1c", cursor: "pointer", fontSize: 12, fontWeight: 800 }}>{c.delete}</button></div></td></tr>;
  })}</tbody></table></div>;
}

export function ProductCards({ products, onStock, onSale }: { products: Product[]; onStock: (id: string) => void; onSale: (id: string) => void }) {
  const locale = useDashboardLocale();
  const c = COPY[locale];
  if (products.length === 0) return <EmptyState title={c.emptyTitle} description={c.emptyShort} />;
  return <div className="mobile-cards" style={{ display: "none", gap: 12 }}>{products.map((item) => {
    const suspiciousMargin = Math.abs(item.margin) > 300 || (item.costPrice > 0 && item.sellingPrice > 0 && item.sellingPrice < item.costPrice * 0.25);
    return <div key={item.id} style={{ padding: 16, borderRadius: 18, background: "#ffffff", border: "1px solid #dbe3ef" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><strong>{item.name}</strong><Badge label={item.marketplace || "Manual"} tone="blue" /></div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}><div><small style={{ color: "#64748b" }}>{c.profit}</small><br /><b style={{ color: item.profit >= 0 ? "#0f766e" : "#b91c1c" }}>{money(item.profit)}</b></div><div><small style={{ color: "#64748b" }}>{c.margin}</small><br /><b>{suspiciousMargin ? c.checkMapping : percent(item.margin)}</b></div><div><small style={{ color: "#64748b" }}>{c.stock}</small><br /><b>{item.stockRemaining}</b></div><div><small style={{ color: "#64748b" }}>{c.decision}</small><br /><b>{suspiciousMargin ? c.check : translateProductDecision(productDecision(item), locale)}</b></div></div><div style={{ marginTop: 14, display: "flex", gap: 8 }}><button style={ghostButtonStyle} onClick={() => onStock(item.id)}>{c.stock}</button><button style={ghostButtonStyle} onClick={() => onSale(item.id)}>{c.sell}</button></div></div>;
  })}</div>;
}

export function ProductFilters({ selectedFilter, onChange }: { selectedFilter: ProductFilter; onChange: (filter: ProductFilter) => void }) {
  const locale = useDashboardLocale();
  const c = COPY[locale];
  const filters: [ProductFilter, string][] = [["all", c.filters.all], ["loss", c.filters.loss], ["fix", c.filters.fix], ["scale", c.filters.scale], ["stock", c.filters.stock]];
  return <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{filters.map(([key, label]) => <button key={key} onClick={() => onChange(key)} style={{ ...ghostButtonStyle, background: selectedFilter === key ? "#ecfdf5" : "#ffffff", color: selectedFilter === key ? "#047857" : "#0f172a" }}>{label}</button>)}</div>;
}
