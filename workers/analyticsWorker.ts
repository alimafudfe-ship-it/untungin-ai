import { Worker } from "bullmq";
import { redis } from "../config/redis";

export const analyticsWorker = new Worker(
  "extraction",
  async (job) => {
    const data = job.returnvalue;

    if (!data) return;

    const top = data.sort((a: any, b: any) => b.trend_score - a.trend_score);

    console.log("🔥 TOP TREND:", top[0]);

    return top;
  },
  { connection: redis }
);
