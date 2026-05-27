import { extractionQueue } from "../queues/extractionQueue";

export async function startScheduler() {
  await extractionQueue.add(
    "shopee-trend",
    {
      source: "shopee",
      type: "trend",
    },
    {
      repeat: { every: 60000 }, // tiap 1 menit
    }
  );

  await extractionQueue.add(
    "tiktok-trend",
    {
      source: "tiktok",
      type: "trend",
    },
    {
      repeat: { every: 60000 },
    }
  );
}
