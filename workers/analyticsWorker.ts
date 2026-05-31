// File: ./workers/analyticsWorker.ts (atau lokasi file analytics worker Anda)
import { Worker } from "bullmq";
import { redis } from "../config/redis";

export const analyticsWorker = new Worker(
  "extraction",
  async (job) => {
    // 1. PERBAIKAN UTAMA: Ambil data input dari job.data, bukan job.returnvalue
    const data = job.data; 

    // Validasi apakah data ada dan berbentuk array sebelum melakukan sorting
    if (!data || !Array.isArray(data)) {
      console.warn(`[Analytics Worker] Job #${job.id} dilewati karena data kosong atau bukan array.`);
      return;
    }

    console.log(`[Analytics Worker] Memproses ${data.length} data produk dari antrean...`);

    // 2. Lakukan sorting berdasarkan skor tren tertinggi
    // Gunakan fallback '|| 0' untuk menghindari error jika ada data marketplace yang tidak memiliki trend_score
    const top = [...data].sort((a: any, b: any) => (b.trend_score || 0) - (a.trend_score || 0));

    if (top.length > 0) {
      console.log("🔥 TOP TREND BERHASIL DIANALISIS:", {
        product_name: top[0].product_name,
        marketplace: top[0].marketplace,
        trend_score: top[0].trend_score
      });
    }

    // 3. Data ini sekarang akan tersimpan dengan benar di Redis sebagai returnvalue untuk job yang sukses
    return top; 
  },
  { 
    connection: redis,
    // Opsional: Batasi concurrency agar tidak membebani CPU saat memproses banyak data analitik sekaligus
    concurrency: 2 
  }
);