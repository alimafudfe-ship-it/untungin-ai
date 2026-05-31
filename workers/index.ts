// File: ./workers/main.ts
import { Worker, Queue } from "bullmq";
import { redis } from "../config/redis";

// Import fungsi worker live scraping asli Anda
import { realtimeShopeeWorker } from "./shopee/realtimeShopeeWorker";
import { realtimeTikTokWorker } from "./tiktok/realtimeTikTokWorker";
import { realtimeTokopediaWorker } from "./tokopedia/realtimeTokopediaWorker";

// Buat pemicu antrean skoring agar data bisa dialirkan setelah scraping selesai
const scoringQueue = new Queue("scoring-pipeline", { connection: redis });

async function main() {
  console.log("================================================");
  console.log("🚀 UNTUNGIN AI - SAFE WORKERS PRODUCTION ACTIVE ");
  console.log("================================================");

  /**
   * PROTEKSI UTAMA PERANGKAT KERAS:
   * Menggunakan 'concurrency: 1' memaksa BullMQ memproses antrean secara antre (Seri).
   * Playwright hanya boleh membuka 1 browser saja di satu waktu. CPU & Daya PSU dijamin aman.
   */
  const safeConfig = {
    connection: redis,
    concurrency: 1 // Jangan diubah menjadi lebih tinggi saat masa development lokal!
  };

  // 1. Worker Antrean Shopee
  const shopeeQueueWorker = new Worker(
    "shopee-scouting",
    async (job) => {
      const { keyword } = job.data;
      console.log(`[Queue - Shopee] Memproses kata kunci: ${keyword}`);
      return await realtimeShopeeWorker(keyword);
    },
    safeConfig
  );

  // 2. Worker Antrean Tokopedia
  const tokopediaQueueWorker = new Worker(
    "tokopedia-scouting",
    async (job) => {
      const { keyword } = job.data;
      console.log(`[Queue - Tokopedia] Memproses kata kunci: ${keyword}`);
      return await realtimeTokopediaWorker(keyword);
    },
    safeConfig
  );

  // 3. Worker Antrean TikTok
  const tiktokQueueWorker = new Worker(
    "tiktok-scouting",
    async (job) => {
      const { keyword } = job.data;
      console.log(`[Queue - TikTok] Memproses kata kunci: ${keyword}`);
      return await realtimeTikTokWorker(keyword);
    },
    safeConfig
  );

  /**
   * EVENT LISTENER DATA FLOW:
   * Memotong data mentah hasil scraping dan mengirimkannya ke antrean skoring
   */
  const handleScrapingSuccess = async (job: any, result: any[]) => {
    if (!result || !Array.isArray(result) || result.length === 0) return;

    console.log(`\n📡 [Pipeline] Mengirim ${result.length} data dari Job #${job.id} ke Antrean Skoring...`);
    
    try {
      await scoringQueue.add("process-scoring", result, {
        removeOnComplete: true // Langsung bersihkan Redis setelah selesai agar RAM hemat
      });
    } catch (err) {
      console.error("Gagal memasukkan data ke antrean skoring:", err);
    }
  };

  // Daftarkan fungsi pipeline sukses
  shopeeQueueWorker.on("completed", (job, result) => handleScrapingSuccess(job, result));
  tokopediaQueueWorker.on("completed", (job, result) => handleScrapingSuccess(job, result));
  tiktokQueueWorker.on("completed", (job, result) => handleScrapingSuccess(job, result));

  console.log("📡 Status: Workers are actively waiting for safe serialization tasks...");
}

main().catch((err) => {
  console.error("🛑 Gagal mengaktifkan core worker:", err);
});