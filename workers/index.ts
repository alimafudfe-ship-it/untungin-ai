import { runShopeeWorker } from "./shopeeWorker";
import { runShopeeRealtimeWorker } from "./shopeeRealtimeWorker";
import { runTikTokRealtimeWorker } from "./tiktokRealtimeWorker";
import { runTokopediaRealtimeWorker } from "./tokopediaRealtimeWorker";

import { trendScore, opportunityScore } from "./scoringWorker";
import { logTopTrend } from "./analyticsWorker";

async function main() {
  console.log("🚀 Starting Untungin AI Workers...\n");

  // 🔥 MOCK DATA (SIMULASI MARKETPLACE)
  const products = [
    { name: "Sepatu Wanita", sold: 1200, price: 150000 },
    { name: "Kaos Oversize", sold: 900, price: 80000 },
    { name: "Tas Fashion Korea", sold: 1500, price: 200000 },
    { name: "Celana Cargo", sold: 700, price: 120000 },
  ];

  // 🔥 SCORING
  const enriched = products.map((p) => ({
    ...p,
    trendScore: trendScore(p),
    opportunityScore: opportunityScore(p),
  }));

  console.log("📊 Scored Products:");
  console.table(enriched);

  // 🔥 ANALYTICS
  logTopTrend(enriched);

  // 🔥 WORKER SIMULATION (biar keliatan hidup)
  setInterval(() => {
    console.log("\n🔄 Fetching new data...");
  }, 5000);
}

main();
