// Di dalam file main.ts Anda:
import { Queue } from "bullmq";
import { redis } from "../config/redis";

// Buat pemicu antrean skoring
const scoringQueue = new Queue("scoring-pipeline", { connection: redis });

const handleScrapingSuccess = async (job: any, result: any[]) => {
  if (!result || !Array.isArray(result) || result.length === 0) return;

  console.log(`\n📡 [Pipeline] Mengirim ${result.length} data mentah dari Job #${job.id} ke Antrean Skoring...`);
  
  // Kirim data mentah hasil scraping ke scoringWorker untuk dihitung skornya
  await scoringQueue.add("process-scoring", result);
};