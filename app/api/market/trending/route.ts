
import { getShopeeProducts } from "@/services/shopee";
import { calculateTrendScore } from "@/services/trendEngine";

export async function GET() {
  let products = await getShopeeProducts();

  products = products.map(p => ({
    ...p,
    score: calculateTrendScore(p)
  }));

  products.sort((a, b) => b.score - a.score);

  return Response.json({ products });
}
