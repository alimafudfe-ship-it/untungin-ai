"use client";

import { useState } from "react";

// 🎨 GAYA DESAIN KONSISTEN DASHBOARD UNTUNGIN
const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
};

const ctaButtonStyle = {
  background: "#0f172a",
  color: "#ffffff",
  border: "none",
  padding: "10px 16px",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
  transition: "background 0.2s"
};

export default function AICreatorPage() {
  const [productName, setProductName] = useState("");
  const [niche, setNiche] = useState("Unboxing / Review");
  const [script, setScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // 🛠️ FIX NYATA: Penegasan fungsi mutlak harus 'async'
  const handleGenerateScript = async () => {
    if (!productName.trim()) {
      alert("Masukkan nama produk terlebih dahulu!");
      return;
    }
    
    setLoading(true);
    setScript("");
    setAudioUrl("");

    try {
      // Mengarahkan request ke rute backend bersih terisolasi
      const res = await fetch("/api/creatorscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, niche }),
      });
      
      const result = await res.json();
      
      if (res.ok && result.success) {
        setScript(result.text);
        if (result.audioUrl) setAudioUrl(result.audioUrl);
      } else {
        alert("Gagal generate skrip: " + (result.error || "Terjadi masalah internal server."));
      }
    } catch (err: any) {
      console.error("Koneksi gagal:", err);
      alert("Terjadi kesalahan koneksi menuju server api.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 20, padding: 4 }}>
      {/* Header Panel */}
      <section style={cardStyle}>
        <span style={{ fontSize: 12, background: "#dcfce7", color: "#15803d", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
          AI Co-Pilot Kreator
        </span>
        <h2 style={{ margin: "10px 0 4px", fontWeight: 700, color: "#0f172a" }}>Amunisi Video Konten Melejit</h2>
        <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
          Ketik produk Anda, biarkan AI menyusun naskah video TikTok komersial sekaligus menghasilkan narasi suara otomatis.
        </p>
      </section>

      {/* Main Content Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20, alignItems: "start" }}>
        
        {/* Input Form Box */}
        <div style={{ ...cardStyle, display: "grid", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#0f172a" }}>🎯 Detail Produk</h3>
          
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#475569" }}>Nama Produk Affiliate</label>
            <input 
              type="text" 
              placeholder="Misal: Sandal Camou Premium Men Black"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#475569" }}>Gaya Penyampaian Video</label>
            <select 
              value={niche} 
              onChange={(e) => setNiche(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "#fff", boxSizing: "border-box" }}
            >
              <option value="Unboxing / Review">📦 Unboxing / Review Jujur</option>
              <option value="Soft Selling / Storytelling">📖 Cerita / Keluh Kesah (Soft Sell)</option>
              <option value="Hard Selling / Promo">🔥 Bombastis / Diskon Kilat (Hard Sell)</option>
            </select>
          </div>

          <button 
            type="button"
            onClick={handleGenerateScript} 
            disabled={loading}
            style={{ ...ctaButtonStyle, width: "100%", padding: "12px", marginTop: 8, background: loading ? "#94a3b8" : "#0f172a", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Sedang Meracik Amunisi..." : "🧠 Jalankan AI Pembuat Konten"}
          </button>
        </div>

        {/* Output Result Box */}
        <div style={{ ...cardStyle, display: "grid", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#0f172a" }}>📝 Naskah & Hasil Voice-Over</h3>
          
          {script ? (
            <>
              {audioUrl && (
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: 13, fontWeight: 500, color: "#0f172a" }}>🎧 Hasil Suara Narasi (Voice-Over MP3):</p>
                  <audio src={audioUrl} controls style={{ width: "100%" }} />
                </div>
              )}

              <div style={{ background: "#0f172a", color: "#f8fafc", padding: 16, borderRadius: 8, fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, maxHeight: "350px", overflowY: "auto" }}>
                {script}
              </div>
            </>
          ) : (
            <div style={{ padding: "60px 20px", border: "2px dashed #e2e8f0", borderRadius: 8, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
              Belum ada konten yang diracik. Masukkan nama produk di sebelah kiri dan klik jalankan.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}