// /app/api/market/trending/route.ts
export const runtime = "nodejs";

import { getShopeeProducts } from "@/services/shopee";
import { calculateTrendScore } from "@/services/trendEngine";

export async function GET() {
  try {
    let products = await getShopeeProducts();

    if (!Array.isArray(products)) products = [];

    const ranked = products
      .map((p) => ({
        ...p,
        score: calculateTrendScore({
          sold: Number(p?.sold || 0),
          rating: Number(p?.rating || 0),
          reviews: Number(p?.reviews || 0),
        }),
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    return Response.json({
      success: true,
      products: ranked,
    });
  } catch (error) {
    console.error("market/trending error", error);

    return Response.json(
      {
        success: false,
        products: [],
        error: "Failed to load trending products",
      },
      { status: 200 }
    );
  }
}
