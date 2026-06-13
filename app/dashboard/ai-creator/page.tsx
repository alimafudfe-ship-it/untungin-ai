"use client";

import { useState } from "react";
import { Badge, cardStyle, ctaButtonStyle, ghostButtonStyle } from "@/app/dashboard/ui";

export default function AICreatorPage() {
  const [productName, setProductName] = useState("");
  const [niche, setNiche] = useState("Unboxing / Review");
  const [script, setScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerateScript = async () => {
    if (!productName) return alert("Masukkan nama produk terlebih dahulu!");
    setLoading(true);
    setScript("");
    setAudioUrl("");

    try {
      // 1. Panggil API backend untuk generate skrip teks via Gemini
      const res = await fetch("/api/ai-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, niche }),
      });
      const result = await res.json();
      
      if (result.success) {
        setScript(result.text);
        // Jika file audio MP3 berhasil dibuat oleh sistem TTS, simpan URL-nya
        if (result.audioUrl) setAudioUrl(result.audioUrl);
      } else {
        alert("Gagal generate skrip: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 20, padding: 4 }}>
      {/* Header */}
      <section style={{ ...cardStyle, background: "#ffffff", border: "1px solid #e2e8f0" }}>
        <Badge label="AI Co-Pilot Kreator" tone="success" />
        <h2 style={{ margin: "10px 0 4px", fontWeight: 700 }}>Amunisi Video Konten Melejit</h2>
        <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
          Ketik produk Anda, biarkan AI menyusun naskah video TikTok komersial sekaligus menghasilkan narasi suara otomatis.
        </p>
      </section>

      {/* Main Content Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20, alignItems: "start" }}>
        
        {/* Kolom Kiri: Input */}
        <div style={{ ...cardStyle, background: "#ffffff", border: "1px solid #e2e8f0", display: "grid", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>🎯 Detail Produk</h3>
          
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#475569" }}>Nama Produk Affiliate</label>
            <input 
              type="text" 
              placeholder="Misal: Sandal Camou Premium Men Black"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "#475569" }}>Gaya Penyampaian Video</label>
            <select 
              value={niche} 
              onChange={(e) => setNiche(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "#fff" }}
            >
              <option value="Unboxing / Review">📦 Unboxing / Review Jujur</option>
              <option value="Soft Selling / Storytelling">📖 Cerita / Keluh Kesah (Soft Sell)</option>
              <option value="Hard Selling / Promo">🔥 Bombastis / Diskon Kilat (Hard Sell)</option>
            </select>
          </div>

          <button 
            onClick={handleGenerateScript} 
            disabled={loading}
            style={{ ...ctaButtonStyle, width: "100%", padding: "12px", marginTop: 8, background: loading ? "#94a3b8" : "#0f172a", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Sedang Meracik Amunisi..." : "🧠 Jalankan AI Pembuat Konten"}
          </button>
        </div>

        {/* Kolom Kanan: Hasil */}
        <div style={{ ...cardStyle, background: "#ffffff", border: "1px solid #e2e8f0", display: "grid", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>📝 Naskah & Hasil Voice-Over</h3>
          
          {script ? (
            <>
              {/* Hasil Audio */}
              {audioUrl && (
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: 13, fontWeight: 500, color: "#0f172a" }}>🎧 Hasil Suara Narasi (Voice-Over MP3):</p>
                  <audio src={audioUrl} controls style={{ width: "100%" }} />
                </div>
              )}

              {/* Hasil Teks */}
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