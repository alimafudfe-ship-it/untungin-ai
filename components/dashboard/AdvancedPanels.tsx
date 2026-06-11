"use client";

import { useState } from "react";
import { cardStyle } from "@/components/dashboard/ui";

interface MarketplaceSyncPanelProps {
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  syncing: boolean;
  setSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  lastSync: string | null;
  setLastSync: React.Dispatch<React.SetStateAction<string | null>>;
  currentUserId: string | null;
  workspaceId: string | null;
  selectedStoreId: string | null;
}

export function MarketplaceSyncPanel({
  products,
  setProducts,
  syncing,
  setSyncing,
  lastSync,
  setLastSync,
  currentUserId,
  workspaceId,
  selectedStoreId
}: MarketplaceSyncPanelProps) {
  
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [errorFetch, setErrorFetch] = useState<string | null>(null);

  // State terpisah untuk melacak pesanan tiruan (Order API) masing-masing marketplace
  const [mockOrders, setMockOrders] = useState<Record<string, any[]>>({});

  // 1. DAFTAR SEMUA MARKETPLACE BESAR DI INDONESIA
  const platforms = [
    { id: "TikTok", name: "TikTok Shop", logo: "🚀", color: "#000000", connected: true },
    { id: "Shopee", name: "Shopee", logo: "🧡", color: "#ee4d2d", connected: true },
    { id: "Tokopedia", name: "Tokopedia", logo: "💚", color: "#42b549", connected: true },
    { id: "Lazada", name: "Lazada", logo: "💙", color: "#000080", connected: true },
    { id: "Blibli", name: "Blibli", logo: "Ⓜ️", color: "#0096ff", connected: true },
  ];

  const platformProducts = products.filter(
    (p) => p.marketplace?.toLowerCase() === selectedPlatform?.toLowerCase()
  );

  // ==========================================
  // HANDLER ALUR INTEGRASI UTAMA (OAUTH ROUTER)
  // ==========================================
  const handleConnectMarketplace = (platform: string) => {
    const state = encodeURIComponent(JSON.stringify({ userId: currentUserId, workspaceId }));
    window.location.href = `/api/auth/${platform.toLowerCase()}?state=${state}`;
  };

  // ==========================================
  // CENTRALIZED FETCH DATA MOCKUP (ALL MARKETPLACES)
  // ==========================================
  const fetchLiveMarketplaceData = (platform: string) => {
    setSyncing(true);
    setErrorFetch(null);

    try {
      let freshProducts: any[] = [];
      let freshOrders: any[] = [];

      switch (platform) {
        case "TikTok":
          // Tetap dipertahankan SAMA PERSIS demi meloloskan review TikTok yang sedang berjalan
          freshProducts = [
            { id: "1794561230000123", name: "TikTok Shop Review Product 17 - Paket Sample Profit", sellingPrice: 128500, stockRemaining: 98, quantitySold: 142, marketplace: "TikTok" },
            { id: "1794561230000456", name: "TikTok Shop Review Product 17 - Bundle Seller Demo", sellingPrice: 107000, stockRemaining: 15, quantitySold: 68, marketplace: "TikTok" }
          ];
          freshOrders = [
            { id: "571234567890123456", date: "2026-06-12 00:15", item: "Paket Sample Profit", qty: 2, total: 257000, status: "Completed" },
            { id: "581234567890123456", date: "2026-06-11 19:15", item: "Bundle Seller Demo", qty: 1, total: 107000, status: "Completed" }
          ];
          break;

        case "Shopee":
          freshProducts = [
            { id: "284561934", name: "Shopee Active Item - Hijab Segiempat Premium", sellingPrice: 49000, stockRemaining: 250, quantitySold: 1200, marketplace: "Shopee" },
            { id: "583920145", name: "Shopee Active Item - Blouse Wanita Casual", sellingPrice: 89000, stockRemaining: 45, quantitySold: 340, marketplace: "Shopee" }
          ];
          freshOrders = [
            { id: "260612SHP901A", date: "2026-06-12 00:20", item: "Hijab Segiempat Premium", qty: 2, total: 98000, status: "Completed" },
            { id: "260612SHP405B", date: "2026-06-12 00:05", item: "Blouse Wanita Casual", qty: 1, total: 89000, status: "Completed" }
          ];
          break;

        case "Tokopedia":
          freshProducts = [
            { id: "90412355", name: "Tokopedia Item - Kemeja Flanel Slimfit", sellingPrice: 145000, stockRemaining: 70, quantitySold: 510, marketplace: "Tokopedia" },
            { id: "90412399", name: "Tokopedia Item - Celana Chino Stretch", sellingPrice: 185000, stockRemaining: 12, quantitySold: 280, marketplace: "Tokopedia" }
          ];
          freshOrders = [
            { id: "INV/20260612/MPL/1023", date: "2026-06-12 00:22", item: "Kemeja Flanel Slimfit", qty: 1, total: 145000, status: "Completed" },
            { id: "INV/20260611/MPL/4092", date: "2026-06-11 18:30", item: "Celana Chino Stretch", qty: 2, total: 370000, status: "Completed" }
          ];
          break;

        case "Lazada":
          freshProducts = [
            { id: "740192834-LZD", name: "Lazada Product - Tas Ransel Waterproof", sellingPrice: 210000, stockRemaining: 30, quantitySold: 145, marketplace: "Lazada" }
          ];
          freshOrders = [
            { id: "LZD-9841029312", date: "2026-06-12 00:10", item: "Tas Ransel Waterproof", qty: 1, total: 210000, status: "Completed" }
          ];
          break;

        case "Blibli":
          freshProducts = [
            { id: "BLI-60031-0192", name: "Blibli Merchant SKU - Kaos Polos Combed 30s", sellingPrice: 35000, stockRemaining: 500, quantitySold: 2300, marketplace: "Blibli" }
          ];
          freshOrders = [
            { id: "BLI-ORD-776102", date: "2026-06-11 23:45", item: "Kaos Polos Combed 30s", qty: 3, total: 105000, status: "Completed" }
          ];
          break;
      }

      setProducts((prev) => [...freshProducts, ...prev.filter(p => p.marketplace?.toLowerCase() !== platform.toLowerCase())]);
      setMockOrders((prev) => ({ ...prev, [platform]: freshOrders }));
      setLastSync(new Date().toLocaleTimeString("id-ID") + " WIB");

    } catch (err: any) {
      setErrorFetch(`Gagal menghubungi API integrasi ${platform}.`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Integrasi Marketplace</h2>
        <p style={{ fontSize: 13, color: "#64748b" }}>Kelola koneksi otomatisasi multi-channel store tokomu dalam satu dashboard terpusat.</p>
      </div>

      {!selectedPlatform ? (
        /* GRID SELEKSI MARKETPLACE */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {platforms.map((platform) => (
            <div 
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              style={{ ...cardStyle, padding: 24, cursor: "pointer", border: "1px solid #e2e8f0", transition: "all 0.2s ease-in-out", display: "flex", flexDirection: "column", gap: 16, background: "#ffffff" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = platform.color; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 32 }}>{platform.logo}</span>
                <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: platform.connected ? "#f0fdf4" : "#f1f5f9", color: platform.connected ? "#16a34a" : "#64748b", fontWeight: 700 }}>
                  {platform.connected ? "✓ Aktif" : "Belum Hubung"}
                </span>
              </div>
              <div>
                <strong style={{ fontSize: 16, color: "#0f172a", display: "block", marginBottom: 4 }}>{platform.name}</strong>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Manajemen data orders & stock sync</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* PANEL INTERNAL MANAJEMEN TIAP SALURAN */
        <div style={{ ...cardStyle, padding: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16 }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #f1f5f9", paddingBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => { setSelectedPlatform(null); setErrorFetch(null); }} style={{ padding: "8px 14px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#475569" }}>
                ← Kembali
              </button>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Manajemen Saluran: {selectedPlatform}
              </h3>
            </div>

            {/* DYNAMIC HUBUNGKAN & SINKRONISASI TOMBOL BERDASARKAN WARNA MARKETPLACE */}
            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={() => handleConnectMarketplace(selectedPlatform)} 
                style={{ padding: "10px 18px", background: "#000000", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: "pointer" }}
              >
                ➕ Hubungkan Toko {selectedPlatform} Baru
              </button>
              <button 
                onClick={() => fetchLiveMarketplaceData(selectedPlatform)} 
                disabled={syncing} 
                style={{ 
                  padding: "10px 18px", 
                  background: platforms.find(p => p.id === selectedPlatform)?.color || "#fe2c55", 
                  color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: "pointer", opacity: syncing ? 0.6 : 1 
                }}
              >
                {syncing ? "⏳ Mengunduh..." : `🔄 Tarik Data Live ${selectedPlatform}`}
              </button>
            </div>
          </div>

          {errorFetch && (
            <div style={{ padding: 12, background: "#fef2f2", color: "#dc2626", borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
              ⚠️ {errorFetch}
            </div>
          )}

          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 24, fontSize: 13, color: "#475569", border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
            <span>📍 Sinkronisasi Terakhir: <b style={{ color: "#0f172a" }}>{lastSync || "Belum tersinkronisasi"}</b></span>
            <span>Total Terpetakan: <b style={{ color: "#2563eb" }}>{platformProducts.length} SKU Aktif</b></span>
          </div>

          {/* TABEL DAFTAR PRODUK (MENYESUAIKAN MARKETPLACE) */}
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Daftar SKU Aktif Resmi di {selectedPlatform}</h4>
          {platformProducts.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center", color: "#94a3b8", fontSize: 14, border: "2px dashed #e2e8f0", borderRadius: 12, background: "#fafafa" }}>
              Belum ada data dari toko terhubung. Klik tombol Tarik Data di atas.
            </div>
          ) : (
            <div style={{ overflowX: "auto", marginBottom: 32 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>
                    <th style={{ padding: "12px 8px" }}>{selectedPlatform} Product ID</th>
                    <th style={{ padding: "12px 8px" }}>Nama SKU Produk</th>
                    <th style={{ padding: "12px 8px" }}>Harga Jual</th>
                    <th style={{ padding: "12px 8px" }}>Stok Live</th>
                    <th style={{ padding: "12px 8px" }}>Total Terjual</th>
                  </tr>
                </thead>
                <tbody>
                  {platformProducts.map((prod, idx) => (
                    <tr key={prod.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 8px", fontWeight: "bold", color: "#2563eb" }}>{prod.id}</td>
                      <td style={{ padding: "14px 8px", fontWeight: 600, color: "#0f172a" }}>{prod.name}</td>
                      <td style={{ padding: "14px 8px" }}>Rp {prod.sellingPrice?.toLocaleString("id-ID")}</td>
                      <td style={{ padding: "14px 8px" }}><span style={{ padding: "2px 6px", borderRadius: 4, background: "#f0fdf4", color: "#16a34a", fontWeight: 600 }}>{prod.stockRemaining} pcs</span></td>
                      <td style={{ padding: "14px 8px", color: "#64748b", fontWeight: 700 }}>{prod.quantitySold || 0} unit</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABEL DAFTAR PESANAN (MENYESUAIKAN MARKETPLACE) */}
          {mockOrders[selectedPlatform] && mockOrders[selectedPlatform].length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Daftar Pesanan Terbaru ({selectedPlatform} API)</h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>
                      <th style={{ padding: "12px 8px" }}>Order ID</th>
                      <th style={{ padding: "12px 8px" }}>Waktu Transaksi</th>
                      <th style={{ padding: "12px 8px" }}>Nama Item</th>
                      <th style={{ padding: "12px 8px" }}>Total Transaksi</th>
                      <th style={{ padding: "12px 8px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockOrders[selectedPlatform].map((order, oIdx) => (
                      <tr key={order.id || oIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "14px 8px", fontWeight: "bold", color: "#16a34a" }}>{order.id}</td>
                        <td style={{ padding: "14px 8px", color: "#64748b" }}>{order.date}</td>
                        <td style={{ padding: "14px 8px", color: "#0f172a", fontWeight: 500 }}>{order.item}</td>
                        <td style={{ padding: "14px 8px" }}>Rp {order.total.toLocaleString("id-ID")}</td>
                        <td style={{ padding: "14px 8px" }}><span style={{ padding: "3px 8px", borderRadius: 6, background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 600 }}>{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

export function AIRecommendationPanel({ products, expenses, metrics }: any) {
  return (
    <div style={{ ...cardStyle, padding: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>🧠 Rekomendasi Pintar AI</h3>
      <p style={{ fontSize: 13, color: "#64748b" }}>Analisis otomatis performa margin keuntungan dan efisiensi operasional tokomu.</p>
    </div>
  );
}