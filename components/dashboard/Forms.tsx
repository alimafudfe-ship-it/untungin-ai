"use client";

import React from "react";
import { cardStyle } from "@/components/dashboard/ui";

// ==========================================
// INTERFACES & TYPES DEFINITION
// ==========================================
export interface ProductFormState {
  productName: string;
  costPrice: string;
  sellingPrice: string;
  stockInitial: string;
  quantitySold: string;
  otherCost: string;
  marketplace: string;
}

export interface ExpenseFormState {
  label: string;
  category: string;
  amount: string;
  date: string;
  notes: string;
}

interface ProductFormProps {
  form: ProductFormState;
  loading: boolean;
  products: any[];
  onChange: (nextForm: ProductFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFinish: () => void;
}

interface ExpensePanelProps {
  expenses: any[];
  form: ExpenseFormState;
  metrics: any;
  onChange: (nextExpense: ExpenseFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
}

// ==========================================
// 1. KOMPONEN PRODUCT FORM (PREMIUM LOOK)
// ==========================================
export function ProductForm({
  form,
  loading,
  products,
  onChange,
  onSubmit,
  onFinish
}: ProductFormProps) {
  
  const handleInputChange = (field: keyof ProductFormState, value: string) => {
    onChange({ ...form, [field]: value });
  };

  // =========================================================
  // LOGIKA INTEGRASI OTORISASI TIKTOK SHOP
  // =========================================================
const handleTikTokConnect = () => {
    const appKey = process.env.NEXT_PUBLIC_TIKTOK_APP_KEY || "6k9tqhh1i366s";
    const redirectUri = encodeURIComponent("http://localhost:3000/api/auth/tiktok/callback"); 
    
    // MEMBUAT DATA STATE BERBENTUK STRINK JOSN SESUAI KEBUTUHAN BACKEND
    const stateObj = {
      random: Math.random().toString(36).substring(7),
      workspaceId: "default_workspace" // Ganti dengan variabel ID nyata dari sistem kamu jika ada
    };
    
    const state = encodeURIComponent(JSON.stringify(stateObj));

    // Simpan di localStorage untuk kebutuhan validasi di sisi client jika diperlukan
    localStorage.setItem("tiktok_auth_state", state);

    const authUrl = `https://auth.tiktok-shops.com/oauth/authorize?app_key=${appKey}&state=${state}&redirect_uri=${redirectUri}`;
    
    window.location.href = authUrl;
  };
  
  const savedProducts = products.filter(
    (p) => p.marketplace?.toLowerCase() === form.marketplace?.toLowerCase()
  );

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      {/* CARD 1: INFORMASI UTAMA & MARKETPLACE */}
      <div style={{ ...cardStyle, padding: 24, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
          <span style={{ fontSize: 18 }}>📦</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Informasi Saluran & Produk</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Marketplace Saluran</label>
            <select
              value={form.marketplace}
              onChange={(e) => handleInputChange("marketplace", e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14, background: "#f8fafc", fontWeight: 500, color: "#0f172a" }}
            >
              <option value="TikTok">🚀 TikTok Shop</option>
              <option value="Shopee">🧡 Shopee</option>
              <option value="Tokopedia">💚 Tokopedia</option>
            </select>

            {/* TOMBOL OTORISASI: Hanya tampil kondisional jika memilih TikTok Shop */}
            {form.marketplace === "TikTok" && (
              <button
                type="button"
                onClick={handleTikTokConnect}
                style={{
                  marginTop: 10,
                  padding: "11px 14px",
                  background: "#000000",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#222222"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#000000"}
              >
                ⚡ Otorisasikan Akun TikTok Shop Kamu
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Nama Lengkap SKU Produk</label>
            <input
              type="text"
              value={form.productName}
              onChange={(e) => handleInputChange("productName", e.target.value)}
              placeholder="Contoh: Hijab Segiempat Premium Voal Ultra"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
          </div>
        </div>

        {savedProducts.length > 0 && (
          <div style={{ marginTop: 20, background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
              💡 Produk Tersimpan di Database ({form.marketplace})
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 120, overflowY: "auto", paddingRight: 4 }}>
              {savedProducts.map((p, idx) => (
                <div 
                  key={p.id || idx}
                  onClick={() => onChange({ ...form, productName: p.name, costPrice: p.costPrice || "", sellingPrice: p.sellingPrice || "" })}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#00b14f"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, background: "#f0fdf4", padding: "2px 8px", borderRadius: 6 }}>Pilih & Isi Otomatis</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CARD 2: STRUKTUR HARGA & STOK */}
      <div style={{ ...cardStyle, padding: 24, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
          <span style={{ fontSize: 18 }}>💰</span>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: 0 }}>Metrik Finansial & Inventori</h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Harga Modal HPP (per unit)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: 12, fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>Rp</span>
              <input
                type="number"
                value={form.costPrice}
                onChange={(e) => handleInputChange("costPrice", e.target.value)}
                placeholder="0"
                style={{ width: "100%", padding: "11px 14px 11px 40px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Harga Jual Resmi</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: 12, fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>Rp</span>
              <input
                type="number"
                value={form.sellingPrice}
                onChange={(e) => handleInputChange("sellingPrice", e.target.value)}
                placeholder="0"
                style={{ width: "100%", padding: "11px 14px 11px 40px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Volume Stok Awal</label>
            <input
              type="number"
              value={form.stockInitial}
              onChange={(e) => handleInputChange("stockInitial", e.target.value)}
              placeholder="0"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Total Terjual (Live)</label>
            <input
              type="number"
              value={form.quantitySold}
              onChange={(e) => handleInputChange("quantitySold", e.target.value)}
              placeholder="0"
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Biaya Operasional / Biaya Lainnya</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: 12, fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>Rp</span>
              <input
                type="number"
                value={form.otherCost}
                onChange={(e) => handleInputChange("otherCost", e.target.value)}
                placeholder="0"
                style={{ width: "100%", padding: "11px 14px 11px 40px", borderRadius: 10, border: "1px solid #cbd5e1", fontSize: 14 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
        <button
          type="button"
          onClick={onFinish}
          style={{ padding: "12px 24px", background: "#ffffff", border: "1px solid #cbd5e1", color: "#475569", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Kembali ke Overview
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "12px 28px", background: "#00b14f", color: "#ffffff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(0, 177, 79, 0.2)" }}
        >
          {loading ? "Menyimpan..." : "💾 Simpan & Sinkronisasikan SKU"}
        </button>
      </div>
    </form>
  );
}

// ==========================================
// 2. KOMPONEN EXPENSE PANEL (KEMBALI DI-EXPORT)
// ==========================================
export function ExpensePanel({
  expenses,
  form,
  metrics,
  onChange,
  onSubmit
}: ExpensePanelProps) {
  
  const handleInputChange = (field: keyof ExpenseFormState, value: string) => {
    onChange({ ...form, [field]: value });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      <div style={{ ...cardStyle, padding: 24, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>💰 Log Arus Kas & Pengeluaran Toko</h3>
        <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nama Pengeluaran</label>
            <input 
              type="text" 
              value={form.label} 
              onChange={(e) => handleInputChange("label", e.target.value)} 
              placeholder="Contoh: Biaya Ads TikTok atau Gaji Karyawan" 
              style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }} 
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Kategori</label>
            <select 
              value={form.category} 
              onChange={(e) => handleInputChange("category", e.target.value)} 
              style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }}
            >
              <option value="Ops">Operasional</option>
              <option value="Marketing">Pemasaran / Ads</option>
              <option value="Salary">Gaji</option>
              <option value="Other">Lain-lain</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "span 2" }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nominal Biaya (Rp)</label>
            <input 
              type="number" 
              value={form.amount} 
              onChange={(e) => handleInputChange("amount", e.target.value)} 
              placeholder="0" 
              style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1" }} 
            />
          </div>
          <button type="submit" style={{ gridColumn: "span 2", padding: "12px", background: "#00b14f", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", marginTop: 8 }}>
            ➕ Tambah Catatan Pengeluaran
          </button>
        </form>
      </div>
    </div>
  );
}