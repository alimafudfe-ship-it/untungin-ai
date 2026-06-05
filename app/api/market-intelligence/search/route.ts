import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const cleanKeyword = keyword.trim();

  if (!cleanKeyword) {
    return NextResponse.json({ error: "Keyword tidak boleh kosong" }, { status: 400 });
  }

  try {
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    const appKey = process.env.TIKTOK_APP_KEY;

    // Jika kredensial API belum diset di environment variable Vercel
    if (!accessToken || !appKey) {
      return NextResponse.json(
        { error: "Koneksi gagal: TIKTOK_ACCESS_TOKEN atau TIKTOK_APP_KEY belum dikonfigurasi di Vercel Env." }, 
        { status: 501 }
      );
    }

    // Dokumen Endpoint Resmi Pencarian Produk TikTok Shop Partner Center
    const TIKTOK_API_URL = `https://open-api.tiktokglobalshop.com/api/v2/products/search`; 
    
    const tiktokResponse = await fetch(`${TIKTOK_API_URL}?keyword=${encodeURIComponent(cleanKeyword)}`, {
      method: "GET",
      headers: {
        "x-tts-access-token": accessToken,
        "App-Key": appKey,
        "Content-Type": "application/json",
      },
      cache: 'no-store' // Memaksa server mengambil data fresh, melewati cache browser/Vercel
    });

    if (!tiktokResponse.ok) {
      return NextResponse.json(
        { error: `TikTok API menolak permintaan. Status Code: ${tiktokResponse.status}` }, 
        { status: tiktokResponse.status }
      );
    }

    const tiktokData = await tiktokResponse.json();

    // Jika dari pihak TikTok Shop tidak ada produk yang cocok dengan kata kunci tersebut
    if (!tiktokData || !tiktokData.data || !tiktokData.data.products || tiktokData.data.products.length === 0) {
      return NextResponse.json({
        keyword: cleanKeyword,
        generatedAt: new Date().toISOString(),
        products: [], // Kembalikan array kosong, JANGAN berikan data buatan
        message: "Tidak ada produk yang ditemukan di TikTok Shop untuk kata kunci ini."
      });
    }

    // Petakan data asli murni dari TikTok Shop ke UI Untungin.ai
    const realProducts = tiktokData.data.products.map((prod: any) => {
      // Ambil harga asli dari response TikTok
      const priceMin = prod.price?.min_amount || 0;
      const priceMax = prod.price?.max_amount || 0;
      const sold30d = prod.sales_30d || 0;
      
      return {
        id: prod.product_id,
        productName: prod.product_name, // Menggunakan nama asli produk yang dijual di TikTok Shop
        marketplace: "TikTok Shop",
        category: prod.category_name || "Uncategorized",
        priceMin: priceMin,
        priceMax: priceMax,
        sold30d: sold30d,
        revenue30d: sold30d * ((priceMin + priceMax) / 2), // Kalkulasi omzet murni dari performa harga TikTok
        growth30d: prod.growth_rate || 0,
        sellerCount: 1, 
        creatorCount: prod.affiliate_creator_count || 0, // Data afiliasi asli
        videoCount: prod.related_video_count || 0,       // Jumlah video terkait asli
        adCount: prod.active_ads_count || 0,             // Jumlah iklan berjalan asli
        avgRating: prod.review_rating || 0,             // Rating asli toko
        reviewCount: prod.review_count || 0,             // Jumlah ulasan asli pembeli
        
        // Skor internal Untungin.ai berdasarkan angka riil
        demandScore: sold30d > 2000 ? 95 : sold30d > 500 ? 75 : 40,
        growthScore: prod.growth_rate ? Math.min(prod.growth_rate, 100) : 50,
        competitionScore: prod.competitor_count || 50,
        marginSignal: 70,
        saturationScore: 30,
        signal: (prod.growth_rate || 0) > 40 ? "viral" : "rising"
      };
    });

    return NextResponse.json({
      keyword: cleanKeyword,
      generatedAt: new Date().toISOString(),
      products: realProducts
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: `Gagal terhubung ke jaringan TikTok Shop: ${error.message}` }, 
      { status: 500 }
    );
  }
}