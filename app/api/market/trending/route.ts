// /app/api/market/trending/route.ts
export const runtime = "nodejs";

import { createClient } from "@supabase/supabase-js";
import { getShopeeProducts } from "@/services/shopee";
import { calculateTrendScore } from "@/services/trendEngine";

export async function GET() {
  try {
    let products = await getShopeeProducts();

    // kalau Shopee kosong → ambil dari Supabase
    if (!Array.isArray(products) || products.length === 0) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      products =
        data?.map((p) => ({
          id: p.id,
          title: p.name,
          price: Number(p.selling_price || 0),
          sold: Number(p.quantity_sold || 0),
          rating: 4.5,
          reviews: Number(p.quantity_sold || 0),
          image: "/placeholder-product.png",
          platform: p.marketplace,
          created_at: p.created_at,
        })) || [];
    }

    const ranked = products
      .map((p) => ({
        ...p,
        score: calculateTrendScore({
          sold: Number(p.sold || 0),
          rating: Number(p.rating || 0),
          reviews: Number(p.reviews || 0),
        }),
      }))
      .sort((a, b) => b.score - a.score);

    return Response.json({
      success: true,
      products: ranked,
    });
  } catch (error) {
    console.error(error);

    return Response.json({
      success: false,
      products: [],
    });
  }
}