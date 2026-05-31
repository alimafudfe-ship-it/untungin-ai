// File: ./workers/scoringWorker.ts (atau lokasi file scoring worker Anda)
import { Worker } from "bullmq";
import { redis } from "../config/redis";

// 1. Sesuaikan fungsi normalisasi dengan properti asli dari Live Scraper (product_name, sales)
function normalize(product: any) {
  return {
    product_name: product.product_name || product.title || "Produk Tanpa Nama",
    price: Number(product.price) || 0,
    sales: Number(product.sales) || 0,
    marketplace: product.marketplace || "Unknown",
  };
}

function calculateTrendScore(p: any) {
  // Rumus standarisasi Untungin AI + faktor acak mikro
  return Math.min(100, Math.floor(p.sales * 0.7 + Math.random() * 30));
}

function calculateOpportunityScore(p: any) {
  if (p.price === 0) return 50; // Fallback jika harga tidak terdeteksi
  // Rumus rasio penjualan berbanding harga (makin murah dan makin laku = opportunity tinggi)
  const score = (p.sales / p.price) * 10000; 
  return Math.min(100, Math.floor(score || 10)); // Batasi maksimal skor di angka 100
}

export const scoringWorker = new Worker(
  "scoring-pipeline", // Ganti nama antrean agar spesifik dan tidak bentrok
  async (job) => {
    // PERBAIKAN UTAMA: Ambil data dari job.data, bukan job.returnvalue
    const rawData = job.data;

    if (!rawData || !Array.isArray(rawData)) {
      console.warn(`[Scoring Worker] Job #${job.id} dilewati karena payload kosong.`);
      return [];
    }

    console.log(`[Scoring Worker] Menghitung skor performa pasar untuk ${rawData.length} produk...`);

    const enrichedData = rawData.map((p: any) => {
      const clean = normalize(p);

      return {
        ...clean,
        trend_score: calculateTrendScore(clean),
        opportunity_score: calculateOpportunityScore(clean),
        updatedAt: new Date().toISOString()
      };
    });

    console.log(`✅ [Scoring Worker] Job #${job.id} selesai diproses dengan sukses.`);
    
    // Hasil return ini akan otomatis masuk ke job.returnvalue milik scoringWorker di Redis
    return enrichedData; 
  },
  { connection: redis }
);