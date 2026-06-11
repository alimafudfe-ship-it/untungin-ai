export default function TikTokReviewPage() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", padding: "40px", lineHeight: "1.6" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ color: "#0052FF", fontSize: "2.5rem" }}>Untungin.ai</h1>
        <p style={{ fontSize: "1.2rem", color: "#666" }}>Sistem Operasi Seller (SaaS) Berbasis AI untuk Marketplace</p>
      </div>

      <div style={{ background: "#f8fafc", padding: "30px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <h2>Tentang Aplikasi</h2>
        <p><strong>Untungin.ai</strong> adalah platform Sistem Operasi Seller (SaaS) mutakhir berbasis AI yang dirancang khusus untuk mempermudah operasional para seller di marketplace. Aplikasi ini menyediakan solusi manajemen toko terpusat yang mencakup sinkronisasi data produk secara real-time, pengelolaan stok otomatis, pemantauan omset penjualan harian, serta penghitungan margin profit bersih secara akurat.</p>
        
        <h3 style={{ marginTop: "20px" }}>Platform yang Terintegrasi:</h3>
        <p>Shopee, Tokopedia, Lazada, Blibli, dan TikTok Shop.</p>
      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <a href="https://untungin-ai-pmd1.vercel.app/" style={{ background: "#0052FF", color: "#fff", padding: "14px 28px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
          Buka Dashboard Utama
        </a>
      </div>
    </div>
  );
}