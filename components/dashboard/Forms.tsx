import { useMemo, useState } from "react";
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
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const normalizedName = form.productName.trim().toLowerCase();
  const productOptions = useMemo(() => Array.from(new Map(products.map((item) => [`${item.name.trim().toLowerCase()}-${item.marketplace || "Manual"}`, item])).values()), [products]);
  const matchedProduct = productOptions.find((item) => item.name.trim().toLowerCase() === normalizedName && (item.marketplace || "Manual") === form.marketplace)
    || productOptions.find((item) => item.name.trim().toLowerCase() === normalizedName);
  const filteredProductOptions = productOptions
    .filter((item) => !form.marketplace || (item.marketplace || "Manual") === form.marketplace || !form.productName.trim())
    .filter((item) => !normalizedName || item.name.toLowerCase().includes(normalizedName) || (item.marketplace || "Manual").toLowerCase().includes(normalizedName))
    .slice(0, 6);

  function applySelectedProduct(selected: Product) {
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
    setProductPickerOpen(false);
  }

  function selectExistingProduct(name: string) {
    const selected = productOptions.find((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase() && (item.marketplace || "Manual") === form.marketplace)
      || productOptions.find((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (!selected) {
      onChange({ ...form, productName: name });
      setProductPickerOpen(true);
      return;
    }
    applySelectedProduct(selected);
  }

  return <section style={cardStyle}>
    <Badge label="Input Produk" tone="success" />
    <h2 style={{ marginBottom: 6 }}>Tambah / catat penjualan produk</h2>
    <p style={{ margin: "0 0 14px", color: "#64748b", lineHeight: 1.6, fontSize: 13 }}>Ketik produk baru, atau pilih produk tersimpan di bawah agar stok dan profit tersambung otomatis.</p>
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <select value={form.marketplace} onChange={(e) => onChange({ ...form, marketplace: e.target.value })} style={inputStyle}><option>Shopee</option><option>Tokopedia</option><option>TikTok Shop</option><option>Lazada</option><option>Manual</option></select>
      <div style={{ position: "relative", display: "grid", gap: 8 }}>
        <input value={form.productName} onFocus={() => setProductPickerOpen(true)} onChange={(e) => selectExistingProduct(e.target.value)} placeholder="Nama produk" style={inputStyle} autoComplete="off" />
        {productOptions.length ? <div style={{ display: "grid", gap: 8, padding: 10, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <small style={{ color: "#64748b", fontWeight: 850 }}>Produk tersimpan</small>
            <small style={{ color: "#94a3b8" }}>{filteredProductOptions.length ? "Klik untuk pilih" : "Tidak ada yang cocok"}</small>
          </div>
          {filteredProductOptions.length ? <div style={{ display: "grid", gap: 6, maxHeight: productPickerOpen ? 230 : 112, overflowY: "auto" }}>
            {filteredProductOptions.map((item) => <button
              key={`${item.id}-${item.marketplace}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applySelectedProduct(item)}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto",
                gap: 8,
                alignItems: "center",
                width: "100%",
                textAlign: "left",
                border: "1px solid #e2e8f0",
                background: matchedProduct?.id === item.id ? "#ecfdf5" : "#ffffff",
                color: "#0f172a",
                borderRadius: 13,
                padding: "9px 10px",
                cursor: "pointer",
                boxShadow: "0 8px 18px rgba(15,23,42,0.04)",
              }}>
              <span style={{ minWidth: 0 }}>
                <strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 13 }}>{item.name}</strong>
                <small style={{ color: "#64748b" }}>{item.marketplace || "Manual"} · stok {item.stockRemaining} · terjual {item.quantitySold}</small>
              </span>
              <span style={{ color: "#0f766e", fontWeight: 900, fontSize: 12 }}>Pilih</span>
            </button>)}
          </div> : <small style={{ color: "#94a3b8", lineHeight: 1.5 }}>Ketik nama lain atau ubah marketplace untuk mencari produk tersimpan.</small>}
        </div> : <div style={{ padding: 10, borderRadius: 14, background: "#f8fafc", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>Belum ada produk tersimpan. Setelah produk pertama disimpan, namanya akan muncul otomatis di sini.</div>}
      </div>
      {matchedProduct ? <div style={{ padding: 12, borderRadius: 14, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", fontSize: 13, lineHeight: 1.55 }}><strong>Produk dipilih:</strong> {matchedProduct.name} · stok tersedia {matchedProduct.stockRemaining}. Isi kolom <b>Terjual</b>, lalu simpan untuk mengurangi stok otomatis.</div> : null}
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
