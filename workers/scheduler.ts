// File: ./services/scheduler.ts (atau lokasi file scheduler Anda)
import { Queue } from "bullmq";
import { redis } from "../config/redis";

// Cari bagian baris 6-8 di file scheduler.ts Anda, ubah menjadi seperti ini:
const shopeeQueue = new Queue("shopee-scouting", { connection: redis as any });
const tokopediaQueue = new Queue("tokopedia-scouting", { connection: redis as any });
const tiktokQueue = new Queue("tiktok-scouting", { connection: redis as any });

export async function startScheduler() {
  console.log("⏱️  [Scheduler] Mengonfigurasi jadwal otomatisasi crawling...");

  // Daftar kata kunci acak untuk rotasi riset pasar otomatis
  const seedKeywords = ["sepatu trending", "kamera", "kemeja pria", "tas fashion"];
  const getRandomKeyword = () => seedKeywords[Math.floor(Math.random() * seedKeywords.length)];

  try {
    // 1. JADWAL RUTIN SHOPEE (Setiap 1 Menit)
    await shopeeQueue.add(
      "shopee-automated-trend",
      { keyword: getRandomKeyword() },
      {
        repeat: { every: 60000 }, // Interval eksekusi otomatis tiap 1 menit
        removeOnComplete: true,   // Bersihkan riwayat Redis jika sukses agar RAM Redis hemat
        removeOnFail: 100,        // Batasi log error maksimal 100 riwayat saja
      }
    );

    // 2. JADWAL RUTIN TOKOPEDIA (Setiap 1 Menit)
    await tokopediaQueue.add(
      "tokopedia-automated-trend",
      { keyword: getRandomKeyword() },
      {
        repeat: { every: 60000 },
        removeOnComplete: true,
        removeOnFail: 100,
      }
    );

    // 3. JADWAL RUTIN TIKTOK (Setiap 1 Menit)
    await tiktokQueue.add(
      "tiktok-automated-trend",
      { keyword: getRandomKeyword() },
      {
        repeat: { every: 60000 },
        removeOnComplete: true,
        removeOnFail: 100,
      }
    );

    console.log("✅ [Scheduler] Seluruh pipeline jadwal (Shopee, Tokopedia, TikTok) BERHASIL didaftarkan ke Redis.");
  } catch (error) {
    console.error("❌ [Scheduler] Gagal mendaftarkan jadwal ke Redis:", error);
  }
}