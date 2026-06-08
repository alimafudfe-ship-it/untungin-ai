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
  
  // 1. State untuk melacak marketplace yang diklik user
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Data tiruan / daftar marketplace yang tersedia
  const platforms = [
    { id: "TikTok", name: "TikTok Shop", logo: "🚀", color: "#000000", connected: true },
    { id: "Shopee", name: "Shopee", logo: "🧡", color: "#ee4d2d", connected: false },
    { id: "Tokopedia", name: "Tokopedia", logo: "💚", color: "#42b549", connected: false },
  ];

  // Filter produk berdasarkan marketplace yang sedang aktif diklik
  const platformProducts = products.filter(p => p.marketplace === selectedPlatform);

  // Fungsi simulasi sinkronisasi data per platform
  const handleSyncData = async (platform: string) => {
    setSyncing(true);
    // Simulasi fetch API backend Untungin.ai ke API E-commerce
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLastSync(new Date().toLocaleTimeString());
    setSyncing(false);
    alert(`Sukses menyinkronkan data dari ${platform}!`);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Integrasi Marketplace</h2>
        <p style={{ fontSize: 13, color: "#64748b" }}>Kelola koneksi multi-channel store tokomu dalam satu panel terpusat.</p>
      </div>

      {/* TAMPILAN 1: JIKA USER BELUM MEMILIH PLATFORM (MENU UTAMA) */}
      {!selectedPlatform ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {platforms.map((platform) => (
            <div 
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)} // <--- Mengaktifkan klik di sini
              style={{ 
                ...cardStyle, 
                padding: 20, 
                cursor: "pointer", 
                border: "1px solid #e2e8f0", 
                transition: "transform 0.2s, border-color 0.2s",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = platform.color;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 28 }}>{platform.logo}</span>
                <span style={{ 
                  fontSize: 11, 
                  padding: "4px 8px", 
                  borderRadius: 20, 
                  background: platform.connected ? "#f0fdf4" : "#f1f5f9", 
                  color: platform.connected ? "#16a34a" : "#64748b",
                  fontWeight: 600
                }}>
                  {platform.connected ? "Terhubung" : "Belum Konek"}
                </span>
              </div>
              <div>
                <strong style={{ fontSize: 16, color: "#0f172a", display: "block" }}>{platform.name}</strong>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Klik untuk melihat detail data</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TAMPILAN 2: DETAIL DATA SETELAH USER KLIK SALAH SATU MARKETPLACE */
        <div style={{ ...cardStyle, padding: 24, background: "#fff", border: "1px solid #e2e8f0" }}>
          
          {/* Header Internal Detail Platform */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button 
                onClick={() => setSelectedPlatform(null)} // <--- Fungsi Kembali ke Menu Utama
                style={{ padding: "6px 12px", background: "#f1f5f9", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569" }}
              >
                ← Kembali
              </button>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Manajemen Data: {selectedPlatform}
              </h3>
            </div>

            <button
              onClick={() => handleSyncData(selectedPlatform)}
              disabled={syncing}
              style={{ padding: "10px 16px", background: "#00b14f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: "pointer", opacity: syncing ? 0.6 : 1 }}
            >
              {syncing ? "Sedang Menarik Data..." : `⚡ Tarik Data ${selectedPlatform}`}
            </button>
          </div>

          {/* Info Ringkas Sinkronisasi */}
          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 8, marginBottom: 20, fontSize: 13, color: "#475569" }}>
            📍 Last Sync Status: <b>{lastSync || "Belum pernah disinkronkan"}</b> | Total Terpetakan: <b>{platformProducts.length} Produk</b>
          </div>

          {/* Tabel / List Data Khusus Marketplace Terpilih */}
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 12 }}>Daftar Produk Terhubung ({selectedPlatform})</h4>
          
          {platformProducts.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              Belum ada data produk untuk platform ini. Silakan klik tombol <b>Tarik Data</b> di atas untuk sinkronisasi pertama kali.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}>
                    <th style={{ padding: "10px 8px" }}>Nama Produk</th>
                    <th style={{ padding: "10px 8px" }}>Harga Jual</th>
                    <th style={{ padding: "10px 8px" }}>Stok Sistem</th>
                    <th style={{ padding: "10px 8px" }}>Terjual</th>
                  </tr>
                </thead>
                <tbody>
                  {platformProducts.map((prod, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 8px", fontWeight: 600, color: "#0f172a" }}>{prod.name}</td>
                      <td style={{ padding: "12px 8px" }}>Rp {prod.sellingPrice?.toLocaleString()}</td>
                      <td style={{ padding: "12px 8px" }}>{prod.stockRemaining} pcs</td>
                      <td style={{ padding: "12px 8px", color: "#16a34a", fontWeight: 600 }}>{prod.quantitySold}x</td>
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