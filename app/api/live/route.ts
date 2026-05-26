import { scrapeShopee } from "@/workers/shopeeWorker";

export async function GET() {
  const data = await scrapeShopee("sepatu");
  return Response.json({ success: true, data });
}
