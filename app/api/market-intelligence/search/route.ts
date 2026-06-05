import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword) {
    return NextResponse.json({ error: "Keyword diperlukan" }, { status: 400 });
  }

  try {
    // 1. Panggil API Resmi TikTok Shop Partner Center menggunakan Credentials Untungin.ai
    // Sesuaikan URL Sandbox/Production & dapatkan Access Token dari database/session Anda
    const TIKTOK_API_URL = `https://open-api.tiktokglobalshop.com/api/v2/products/search`; 
    
    const tiktokResponse = await fetch(`${TIKTOK_API_URL}?keyword=${encodeURIComponent(keyword)}`, {
      method: "GET",
      headers: {
        "x-tts-access-token": process.env.TIKTOK_ACCESS_TOKEN || "", // Ambil token integrasi aktif
        "App-Key": process.env.TIKTOK_APP_KEY || "",
        "Content-Type": "application/json",
      },
      // Cache diset 'no-store' agar data selalu real-time mengambil dari TikTok saat di-refresh
      cache: 'no-store' 
    });

    if (!tiktokResponse.ok) {
      throw new Error("Gagal mengambil data langsung dari TikTok Shop API");
    }

    const tiktokData = await tiktokResponse.json();

    // 2. Petakan (Mapping) format data dari TikTok Shop ke format UI Untungin.ai
    // Ini memastikan visual grafik, harga, dan total terjual muncul akurat
    const formattedProducts = (tiktokData.data?.products || []).map((prod: any) => {
      const priceMin = prod.price?.min_amount || 0;
      const priceMax = prod.price?.max_amount || 0;
      const sold30d = prod.sales_30d || 0;
      
      return {
        id: prod.product_id,
        productName: prod.product_name,
        marketplace: "TikTok Shop",
        category: prod.category_name || "General",
        priceMin: priceMin,
        priceMax: priceMax,
        sold30d: sold30d,
        revenue30d: sold30d * ((priceMin + priceMax) / 2), // Estimasi Omzet real-time
        growth30d: prod.growth_rate || 0,
        sellerCount: 1, 
        creatorCount: prod.affiliate_creator_count || 0,
        videoCount: prod.related_video_count || 0,
        adCount: prod.active_ads_count || 0,
        avgRating: prod.review_rating || 4.5,
        reviewCount: prod.review_count || 0,
        // Kalkulasi matriks intelijen pasar Untungin.ai
        demandScore: prod.sales_30d > 1000 ? 90 : 65,
        growthScore: prod.growth_rate > 50 ? 85 : 60,
        competitionScore: prod.competitor_count || 40,
        marginSignal: 75,
        saturationScore: 25,
        signal: prod.growth_rate > 40 ? "viral" : "rising"
      };
    });

    return NextResponse.json({
      keyword: keyword,
      generatedAt: new Date().toISOString(),
      products: formattedProducts
    });

  } catch (error: any) {
    console.error("TikTok Fetch Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}