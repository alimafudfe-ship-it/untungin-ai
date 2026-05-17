import type React from "react";
import type { Expense, Product, StockMoveType } from "@/types/dashboard";
import { EXPENSE_CATEGORIES } from "@/lib/dashboard/constants";
import { money } from "@/lib/dashboard/format";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle, inputStyle, StatCard } from "./ui";

export type ProductFormState = { productName: string; costPrice: string; sellingPrice: string; stockInitial: string; quantitySold: string; otherCost: string; marketplace: string };
export type ExpenseFormState = { label: string; category: string; amount: string; date: string; notes: string };

export function ProductForm({
  form,
  loading,
  products,
  onChange,
  onSubmit,
  onFinish,
}: {
  form: ProductFormState;
  loading: boolean;
  products: Product[];
  onChange: (form: ProductFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onFinish: () => void;
}) {
  const normalizedName = form.productName.trim().toLowerCase();
  const matchedProduct = products.find((item) => item.name.trim().toLowerCase() === normalizedName);
  const productOptions = Array.from(new Map(products.map((item) => [`${item.name.trim().toLowerCase()}-${item.marketplace || "Manual"}`, item])).values());

  function selectExistingProduct(name: string) {
    const selected = products.find((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (!selected) {
      onChange({ ...form, productName: name });
      return;
    }
    onChange({
      ...form,
      productName: selected.name,
      marketplace: selected.marketplace || form.marketplace || "Manual",
      costPrice: String(selected.costPrice || ""),
      sellingPrice: String(selected.sellingPrice || ""),
      stockInitial: String(selected.stockRemaining || 0),
      quantitySold: "",
      otherCost: "",
    });
  }

  return <section style={cardStyle}>
    <Badge label="Input Produk" tone="success" />
    <h2 style={{ marginBottom: 6 }}>Tambah / catat penjualan produk</h2>
    <p style={{ margin: "0 0 14px", color: "#64748b", lineHeight: 1.6, fontSize: 13 }}>Ketik atau pilih nama produk lama. Jika produk sudah ada, isi qty terjual untuk mengurangi stok otomatis tanpa membuat produk dobel.</p>
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <select value={form.marketplace} onChange={(e) => onChange({ ...form, marketplace: e.target.value })} style={inputStyle}><option>Shopee</option><option>Tokopedia</option><option>TikTok Shop</option><option>Lazada</option><option>Manual</option></select>
      <input list="existing-product-names" value={form.productName} onChange={(e) => selectExistingProduct(e.target.value)} placeholder="Nama produk" style={inputStyle} autoComplete="off" />
      <datalist id="existing-product-names">
        {productOptions.map((item) => <option key={`${item.id}-${item.marketplace}`} value={item.name}>{`${item.marketplace || "Manual"} · stok ${item.stockRemaining} · terjual ${item.quantitySold}`}</option>)}
      </datalist>
      {matchedProduct ? <div style={{ padding: 12, borderRadius: 14, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", fontSize: 13, lineHeight: 1.55 }}><strong>Produk ditemukan:</strong> {matchedProduct.name} · stok tersedia {matchedProduct.stockRemaining}. Isi kolom <b>Terjual</b>, lalu simpan untuk mengurangi stok otomatis.</div> : null}
      <input value={form.costPrice} onChange={(e) => onChange({ ...form, costPrice: e.target.value })} type="number" min="0" placeholder="Modal per produk" style={inputStyle} />
      <input value={form.sellingPrice} onChange={(e) => onChange({ ...form, sellingPrice: e.target.value })} type="number" min="0" placeholder="Harga jual" style={inputStyle} />
      <div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input value={form.stockInitial} onChange={(e) => onChange({ ...form, stockInitial: e.target.value })} type="number" min="0" placeholder={matchedProduct ? "Stok tersedia" : "Stok awal"} style={inputStyle} />
        <input value={form.quantitySold} onChange={(e) => onChange({ ...form, quantitySold: e.target.value })} type="number" min="0" placeholder="Terjual" style={inputStyle} />
      </div>
      <input value={form.otherCost} onChange={(e) => onChange({ ...form, otherCost: e.target.value })} type="number" min="0" placeholder="Biaya lain" style={inputStyle} />
      <div style={{ display: "grid", gap: 10 }}>
        <button type="submit" disabled={loading} style={{ ...ctaButtonStyle, opacity: loading ? 0.7 : 1 }}>{loading ? "Menyimpan..." : matchedProduct ? "Simpan penjualan & tambah lagi" : "Simpan & tambah lagi"}</button>
        <button type="button" disabled={loading} onClick={onFinish} style={{ ...ghostButtonStyle, opacity: loading ? 0.7 : 1 }}>{matchedProduct ? "Simpan penjualan & selesai" : "Simpan & selesai"}</button>
      </div>
    </form>
  </section>;
}

export function ExpensePanel({ expenses, form, metrics, onChange, onSubmit }: { expenses: Expense[]; form: ExpenseFormState; metrics: { totalRevenue: number; totalProfit: number; totalExpenses: number; netCash: number }; onChange: (form: ExpenseFormState) => void; onSubmit: (event: React.FormEvent) => void }) {
  return <><section style={cardStyle}><Badge label="Expense Engine" tone="warning" /><h2>Catat biaya operasional</h2><p style={{ color: "#64748b", lineHeight: 1.7 }}>Pisahkan biaya ads, packing, fee marketplace, tools, gaji, dan operasional agar cashflow tidak semu.</p><form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}><input value={form.label} onChange={(e) => onChange({ ...form, label: e.target.value })} placeholder="Nama biaya" style={inputStyle} /><select value={form.category} onChange={(e) => onChange({ ...form, category: e.target.value })} style={inputStyle}>{EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select><div className="two-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><input value={form.amount} onChange={(e) => onChange({ ...form, amount: e.target.value })} type="number" min="0" placeholder="Nominal" style={inputStyle} /><input value={form.date} onChange={(e) => onChange({ ...form, date: e.target.value })} type="date" style={inputStyle} /></div><input value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} placeholder="Catatan opsional" style={inputStyle} /><button style={ctaButtonStyle}>Tambah biaya</button></form></section><section style={cardStyle}><Badge label="Cashflow Real" tone={metrics.netCash >= 0 ? "success" : "danger"} /><h2 style={{ margin: "10px 0" }}>{money(metrics.netCash)} cashflow bersih</h2><div className="metrics-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "16px 0" }}><StatCard label="Uang masuk" value={money(metrics.totalRevenue)} helper="Dari sales produk" tone="blue" /><StatCard label="Profit produk" value={money(metrics.totalProfit)} helper="Sebelum biaya operasional" tone="success" /><StatCard label="Uang keluar" value={money(metrics.totalExpenses)} helper="Ads, fee, packing, ops" tone="warning" /></div><div style={{ display: "grid", gap: 10 }}>{expenses.map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: 14, borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0" }}><div><strong>{item.label}</strong><div style={{ color: "#64748b", fontSize: 12 }}>{item.category} · {item.date}</div>{item.notes && <small style={{ color: "#64748b" }}>{item.notes}</small>}</div><strong>{money(item.amount)}</strong></div>)}</div></section></>;
}

export function StockForm({ products, stockMove, onChange, onSubmit }: { products: Product[]; stockMove: { productId: string; type: StockMoveType; qty: string; note: string }; onChange: (stockMove: { productId: string; type: StockMoveType; qty: string; note: string }) => void; onSubmit: (event: React.FormEvent) => void }) {
  return <div style={cardStyle}><Badge label="Stock Movement" tone="success" /><h2>Update stok</h2><p style={{ color: "#64748b", lineHeight: 1.7 }}>Stok masuk, keluar manual, atau stok opname.</p><form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}><select value={stockMove.productId} onChange={(e) => onChange({ ...stockMove, productId: e.target.value })} style={inputStyle}><option value="">Pilih produk</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select value={stockMove.type} onChange={(e) => onChange({ ...stockMove, type: e.target.value as StockMoveType })} style={inputStyle}><option value="in">Stok masuk / restock</option><option value="out">Stok keluar manual</option><option value="adjust">Set stok aktual</option></select><input value={stockMove.qty} onChange={(e) => onChange({ ...stockMove, qty: e.target.value })} type="number" min="0" placeholder="Jumlah" style={inputStyle} /><input value={stockMove.note} onChange={(e) => onChange({ ...stockMove, note: e.target.value })} placeholder="Catatan opsional" style={inputStyle} /><button style={ctaButtonStyle}>Update stok</button></form></div>;
}

export function SaleForm({ products, saleForm, onChange, onSubmit }: { products: Product[]; saleForm: { productId: string; qty: string; otherCost: string }; onChange: (saleForm: { productId: string; qty: string; otherCost: string }) => void; onSubmit: (event: React.FormEvent) => void }) {
  return <section style={cardStyle}><Badge label="Sales" tone="success" /><h2>Catat penjualan</h2><p style={{ color: "#64748b", lineHeight: 1.7 }}>Penjualan otomatis mengurangi stok dan update profit.</p><form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}><select value={saleForm.productId} onChange={(e) => onChange({ ...saleForm, productId: e.target.value })} style={inputStyle}><option value="">Pilih produk</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} - stok {item.stockRemaining}</option>)}</select><input value={saleForm.qty} onChange={(e) => onChange({ ...saleForm, qty: e.target.value })} type="number" min="1" placeholder="Qty terjual" style={inputStyle} /><input value={saleForm.otherCost} onChange={(e) => onChange({ ...saleForm, otherCost: e.target.value })} type="number" min="0" placeholder="Biaya tambahan transaksi" style={inputStyle} /><button style={ctaButtonStyle}>Simpan penjualan</button></form></section>;
}
