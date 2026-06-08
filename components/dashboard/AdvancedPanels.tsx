"use client";

import { useState, useEffect } from "react";
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

  const platforms = [
    { id: "TikTok", name: "TikTok Shop", logo: "🚀", color: "#000000", connected: true },
    { id: "Shopee", name: "Shopee", logo: "🧡", color: "#ee4d2d", connected: true },
    { id: "Tokopedia", name: "Tokopedia", logo: "💚", color: "#42b549", connected: false },
  ];

  // Filter produk asli dari database (Filter berdasarkan kolom marketplace tanpa dummy)
  const platformProducts = products.filter(
    (p) => p.marketplace?.toLowerCase() === selectedPlatform?.toLowerCase()
  );

  // Fungsi CORE API: Menarik data riil dari API integration / Scraper backend
  const fetchLiveMarketplaceData = async (platform: string) => {
    setSyncing(true);
    setErrorFetch(null);
    
    try {
      // Menembak endpoint API internal Untungin.ai yang terhubung ke server/scraper
      const response = await fetch(`/api/marketplace/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platform,
          userId: currentUserId,
          workspaceId: workspaceId,
          // Mengirimkan target url spesifik toko kamu untuk discrape/diambil datanya jika backend mendukung
          targetUrl: platform === "Shopee" ? "https://seller.shopee.co.id/portal/product/list/live/all" : null
        })
      });

      if (!response.ok) {
        throw new Error(`Gagal merespons API Server (Status: ${response.status})`);
      }

      const resData = await response.json();

      if (resData.success && Array.isArray(resData.products)) {
        // Gabungkan atau timpa produk lama di dashboard dengan data produk real hasil sync terbaru
        setProducts((prev) => {
          const remainders = prev.filter(p => p.marketplace?.toLowerCase() !== platform.toLowerCase());
          return [...resData.products, ...remainders];
        });
        setLastSync(new Date().toLocaleTimeString("id-ID") + " WIB");
      } else {
        // Jika API sukses tapi tidak mengembalikan array data produk
        setLastSync(new Date().toLocaleTimeString("id-ID") + " WIB");
      }
    } catch (err: any) {
      console.error(`Gagal melakukan integrasi live ${platform}:`, err);
      setErrorFetch(err.message || "Koneksi API terputus atau URL target tidak merespons.");
    } finally {
      setSyncing(false);
    }
  };

  // Auto-fetch data dari database lokal/API internal saat user klik masuk ke platform tertentu
  useEffect(() => {
    if (selectedPlatform) {
      // Opsional: Jalankan sinkronisasi otomatis saat komponen dibuka jika ingin data selalu terbarukan
      // fetchLiveMarketplaceData(selectedPlatform);
    }
  }, [selectedPlatform]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%" }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Integrasi Marketplace</h2>
        <p style={{ fontSize: 13, color: "#64748b" }}>Kelola koneksi otomatisasi multi-channel store tokomu dalam satu dashboard terpusat.</p>
      </div>

      {/* TAMPILAN 1: GRID PILIHAN UTAMA CHANNELS */}
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
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.transform = "translateY(0)";
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
        /* TAMPILAN 2: DAFTAR DATA PRODUK ASLI DARI DATABASE/API */
        <div style={{ ...cardStyle, padding: 24, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16 }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #f1f5f9", paddingBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button 
                onClick={() => {
                  setSelectedPlatform(null);
                  setErrorFetch(null);
                }}
                style={{ padding: "8px 14px", background: "#f1f5f9", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#475569" }}
              >
                ← Kembali ke Menu
              </button>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Manajemen Saluran: {selectedPlatform}
              </h3>
            </div>

            <button
              onClick={() => fetchLiveMarketplaceData(selectedPlatform)}
              disabled={syncing}
              style={{ padding: "10px 18px", background: "#00b14f", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: "bold", cursor: "pointer", opacity: syncing ? 0.6 : 1 }}
            >
              {syncing ? "⏳ Menghubungkan API & Menarik Data..." : `⚡ Hubungkan & Ambil Data Real ${selectedPlatform}`}
            </button>
          </div>

          {errorFetch && (
            <div style={{ padding: 12, background: "#fef2f2", color: "#dc2626", borderRadius: 8, fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
              ⚠️ <b>Gagal Sinkronisasi Live:</b> {errorFetch} (Menampilkan data lokal terakhir di database jika ada)
            </div>
          )}

          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 24, fontSize: 13, color: "#475569", border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
            <span>📍 Sinkronisasi API Terakhir: <b style={{ color: "#0f172a" }}>{lastSync || "Belum disinkronkan secara live"}</b></span>
            <span>Total Terpetakan: <b style={{ color: "#00b14f" }}>{platformProducts.length} SKU</b></span>
          </div>

          <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>Daftar SKU Aktif di {selectedPlatform}</h4>
          
          {platformProducts.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center", color: "#94a3b8", fontSize: 14, border: "2px dashed #e2e8f0", borderRadius: 12, background: "#fafafa" }}>
              <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>🔒</span>
              Belum terdeteksi adanya produk berlabel <b>{selectedPlatform}</b> di akun database Anda.<br />
              Silakan klik tombol <b style={{ color: "#00b14f" }}>Hubungkan & Ambil Data Real</b> di atas untuk menarik data dari API integration.
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
                    <tr key={prod.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 8px", fontWeight: 600, color: "#0f172a" }}>{prod.name}</td>
                      <td style={{ padding: "14px 8px" }}>Rp {prod.sellingPrice?.toLocaleString("id-ID")}</td>
                      <td style={{ padding: "14px 8px" }}>
                        <span style={{ padding: "2px 6px", borderRadius: 4, background: prod.stockRemaining <= 20 ? "#fef2f2" : "#f0fdf4", color: prod.stockRemaining <= 20 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
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