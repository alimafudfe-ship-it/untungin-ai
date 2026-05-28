import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { fetchShopee } from "../services/shopeeService";
import { fetchTikTok } from "../services/tiktokService";

export const sourceWorker = new Worker(
  "extraction",
  async (job) => {
    switch (job.data.source) {
      case "shopee":
        return await fetchShopee(job.data);

      case "tiktok":
        return await fetchTikTok(job.data);

      default:
        throw new Error("Unknown source");
    }
  },
  { connection: redis }
);
