import { Worker } from "bullmq";
import { redis } from "../config/redis";

function normalize(product: any) {
  return {
    title: product.name,
    price: product.price,
    sold: product.sold,
    platform: product.platform,
  };
}

function trendScore(p: any) {
  return p.sold * 0.7 + Math.random() * 100;
}

function opportunityScore(p: any) {
  return (p.sold / (p.price || 1)) * 10;
}

export const scoringWorker = new Worker(
  "extraction",
  async (job) => {
    const raw = job.returnvalue;

    if (!raw) return;

    return raw.map((p: any) => {
      const clean = normalize(p);

      return {
        ...clean,
        trend_score: trendScore(clean),
        opportunity_score: opportunityScore(clean),
      };
    });
  },
  { connection: redis }
);
