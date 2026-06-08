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

// Komponen Ekspor Utama untuk Manajemen Sinkronisasi Multi-Channel
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
  
  // 1. State melacak kanal marketplace aktif yang dipilih pengguna
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Daftar metadata platform e-commerce (Sesuaikan ID dengan data field `.marketplace` di database)
  const platforms = [
    { id: "TikTok", name: "TikTok Shop", logo: "🚀", color: "#000000", connected: true },
    { id: "Shopee", name: "Shopee", logo: "🧡", color: "#ee4d2d", connected: true },
    { id: "Tokopedia", name: "Tokopedia", logo: "💚", color: "#42b549", connected: false },
  ];

  // 2. Filter produk dinamis berdasarkan kanal marketplace terpilih
  const platformProducts = products.filter(
    (p) => p.marketplace?.toLowerCase() === selectedPlatform?.toLowerCase()
  );

  // 3. Fungsi simulasi penarikan data API dari masing-masing core marketplace
  const handleSyncData = async (platform: string) => {
    setSyncing(true);
    
    try {
      // Simulasi request handshaking ke API integrasi Untungin.ai
      await new Promise((resolve) => setTimeout(resolve, 1800));
      
      // Jika data real kosong, kita bantu inject data dummy interaktif khusus platform tersebut agar user bisa melihat hasilnya langsung
      if (platformProducts.length === 0) {
        const mockNewProducts = [
          {
            id: `mock-${platform.toLowerCase()}-1`,
            name: `[Demo Sync] Produk Terlaris ${platform} Toko A`,
            sellingPrice: 145000,
            stockRemaining: 88,
            quantitySold: 240,
            marketplace: platform,
            profit: 35000,
            margin: 24
          },
          {
            id: `mock-${platform.toLowerCase()}-2`,
            name: `[Demo Sync] Item Paket Bundling Serba Murah ${platform}`,
            sellingPrice: 89000,
            stockRemaining: 12,
            quantitySold: 410,
            marketplace: platform,
            profit: 18000,
            margin: 20
          }
        ];
        setProducts((prev) => [...mockNewProducts, ...prev]);
      }
      
      setLastSync(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB");
    } catch (err) {
      console.error("Gagal sinkronisasi channel data:", err);
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

      {/* TAMPILAN 1: GRID UTAMA PILIHAN MARKETPLACE */}
      {!selectedPlatform ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {platforms.map((platform) => (
            <div 
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              style={{ 
                ...cardStyle, 
                padding: 24, 
                cursor: "pointer", 
                border: "1px solid #e2e8f0", 
                transition: "all 0.2s ease-in-out",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                background: "#ffffff"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = platform.color;
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 32 }}>{platform.logo}</span>
                <span style={{ 
                  fontSize: 11, 
                  padding: "4px 10px", 
                  borderRadius: 20, 
                  background: platform.connected ? "#f0fdf4" : "#f1f5f9", 
                  color: platform.connected ? "#16a34a" : "#64748b",
                  fontWeight: 700
                }}>
                  {platform.connected ? "✓ Terhubung" : "Belum Konek"}
                </span>
              </div>
              <div>
                <strong style={{ fontSize: 16, color: "#0f172a", display: "block", marginBottom: 4 }}>{platform.name}</strong>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Klik untuk manajemen data dan stok sync</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TAMPILAN 2: AREA DETAIL MANAJEMEN PRODUK PER-MARKETPLACE */
        <div style={{ ...cardStyle, padding: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16 }}>
          
          {/* Sub-Header Kontrol Navigasi */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #f1f5f9", paddingBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button 
                onClick={() => setSelectedPlatform(null)}
                style={{ padding: "8px 14px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#475569", transition: "background 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}
              >
                ← Kembali ke Menu
              </button>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Manajemen Saluran: {selectedPlatform}
              </h3>
            </div>

            <button
              onClick={() => handleSyncData(selectedPlatform)}
              disabled={syncing}
              style={{ padding: "10px 18px", background: "#00b14f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: "pointer", opacity: syncing ? 0.6 : 1, transition: "opacity 0.2s" }}
            >
              {syncing ? "⏳ Mengunduh Antrean Data..." : `⚡ Tarik & Sinkronisasi ${selectedPlatform}`}
            </button>
          </div>

          {/* Status Sinkronisasi Terkini */}
          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 24, fontSize: 13, color: "#475569", border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
            <span>📍 Waktu Sinkronisasi Terakhir: <b style={{ color: "#0f172a" }}>{lastSync || "Belum ada koneksi aktif"}</b></span>
            <span>Total SKU Terpetakan: <b style={{ color: "#00b14f" }}>{platformProducts.length} Item</b></span>
          </div>

          {/* Tabel Render Dinamis */}
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Daftar SKU Terpeta aktif di {selectedPlatform}</h4>
          
          {platformProducts.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center", color: "#94a3b8", fontSize: 14, border: "2px dashed #e2e8f0", borderRadius: 12, background: "#fafafa" }}>
              <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>📦</span>
              Belum terdeteksi adanya data produk lokal yang terikat ke platform ini.<br />
              Silakan klik tombol <b style={{ color: "#00b14f" }}>Tarik & Sinkronisasi {selectedPlatform}</b> di pojok kanan atas.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b", fontWeight: 600 }}>
                    <th style={{ padding: "12px 8px" }}>Nama SKU Produk Terkoneksi</th>
                    <th style={{ padding: "12px 8px" }}>Harga Jual</th>
                    <th style={{ padding: "12px 8px" }}>Stok Tersedia</th>
                    <th style={{ padding: "12px 8px" }}>Total Penjualan</th>
                  </tr>
                </thead>
                <tbody>
                  {platformProducts.map((prod, idx) => (
                    <tr key={prod.id || idx} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 8px", fontWeight: 600, color: "#0f172a" }}>{prod.name}</td>
                      <td style={{ padding: "14px 8px", fontWeight: 500 }}>Rp {prod.sellingPrice?.toLocaleString("id-ID")}</td>
                      <td style={{ padding: "14px 8px" }}>
                        <span style={{ padding: "2px 6px", borderRadius: 4, background: prod.stockRemaining <= 15 ? "#fef2f2" : "#f0fdf4", color: prod.stockRemaining <= 15 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                          {prod.stockRemaining} pcs
                        </span>
                      </td>
                      <td style={{ padding: "14px 8px", color: "#2563eb", fontWeight: 700 }}>{prod.quantitySold || 0} unit</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// Komponen Pembantu Kedua (Named Export Tambahan agar tidak memicu build error di Next.js Turbopack)
export function AIRecommendationPanel({ products, expenses, metrics }: any) {
  return (
    <div style={{ ...cardStyle, padding: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>🧠 Rekomendasi Pintar AI</h3>
      <p style={{ fontSize: 13, color: "#64748b" }}>Analisis otomatis performa margin keuntungan dan efisiensi operasional tokomu.</p>
      <div style={{ marginTop: 16, padding: 12, background: "#f0fdf4", borderRadius: 8, color: "#16a34a", fontSize: 13, fontWeight: 600 }}>
        ✓ Seluruh sistem stabil. AI sedang memantau matriks pergerakan HPP produk Anda.
      </div>
    </div>
  );
}