"use client";

import { useState } from "react";

// 🎨 GAYA DESAIN LOKAL
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

  const handleGenerateScript = async () => {
    if (!productName) return alert("Masukkan nama produk terlebih dahulu!");
    setLoading(true);
    setScript("");
    setAudioUrl("");

    try {
      // 1. Ambil API Key Gemini langsung dari Client Environment
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      if (!apiKey) {
        alert("Eror: Variabel NEXT_PUBLIC_GEMINI_API_KEY belum terdeteksi oleh browser Vercel!");
        setLoading(false);
        return;
      }

      const prompt = `
        Anda adalah seorang kreator konten TikTok dan spesialis Copywriter Afiliasi E-commerce papan atas di Indonesia.
        Buatkan naskah video komersial berdurasi 30-45 detik yang sangat persuasif untuk menjual produk ini: "${productName}".
        Gaya penyampaian video wajib menggunakan tipe: "${niche}".
        
        Format struktur output wajib memiliki pembagian yang jelas seperti ini:
        [HOOK - Detik 0-5] (Bagian pembuka yang bikin mata penonton stop scroll)
        [PROBLEM/STORY] (Masalah nyata atau cerita yang dialami sehari-hari)
        [SOLUTION & BENEFIT] (Keunggulan mutlak produk ini dibanding yang lain)
        [CALL TO ACTION] (Ajakan mendesak untuk klik keranjang kuning sekarang juga sebelum kehabisan diskon)

        Gunakan bahasa Indonesia kasual, gaul, interaktif, dan hindari kata-kata kaku. Tuliskan teks narasinya saja tanpa tambahan instruksi kamera.
      `;

      // 2. 🔥 BYPASS TOTAL BACKEND: Langsung tembak Google AI Studio dengan rute REST v1 stable
      const googleUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const res = await fetch(googleUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result?.error?.message || "Ditolak oleh Server Google.");
      }

      // 3. Ekstrak data teks dari struktur respons resmi Google AI Studio
      const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textOutput) {
        setScript(textOutput);
        // Simulasi audio tetap aman
        setAudioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
      } else {
        alert("Gagal memuat struktur teks dari respons Google.");
      }

    } catch (err: any) {
      console.error(err);
      alert("Gagal generate skrip: " + err.message);
    } finally {
      loading && setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 20, padding: 4 }}>
      {/* Header */}
      <section style={cardStyle}>
        <span style={{ fontSize: 12, background: "#dcfce7", color: "#15803d", padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
          AI Co-Pilot Kreator
        </span>
        <h2 style={{ margin: "10px 0 4px", fontWeight: 700, color: "#0f172a" }}>Amunisi Video Konten Melejit</h2>
        <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
          Ketik produk Anda, biarkan AI menyusun naskah video TikTok komersial sekaligus menghasilkan narasi suara otomatis.
        </p>
      </section>

      {/* Main Content Split */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20, alignItems: "start" }}>
        
        {/* Kolom Kiri: Input */}
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
            <section style={{ display: "block" }}>
              <select 
                value={niche} 
                onChange={(e) => setNiche(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "#fff", boxSizing: "border-box" }}
              >
                <option value="Unboxing / Review">📦 Unboxing / Review Jujur</option>
                <option value="Soft Selling / Storytelling">📖 Cerita / Keluh Kesah (Soft Sell)</option>
                <option value="Hard Selling / Promo">🔥 Bombastis / Diskon Kilat (Hard Sell)</option>
              </select>
            </section>
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
        <div style={{ ...cardStyle, display: "grid", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "#0f172a" }}>📝 Naskah & Hasil Voice-Over</h3>
          
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