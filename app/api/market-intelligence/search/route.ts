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

    if (!accessToken || !appKey) {
      return NextResponse.json(
        { error: "Koneksi gagal: TIKTOK_ACCESS_TOKEN atau TIKTOK_APP_KEY belum dikonfigurasi di Vercel Env." }, 
        { status: 501 }
      );
    }

    // 1. Endpoint Resmi TikTok Menggunakan Struktur POST
    const TIKTOK_API_URL = `https://open-api.tiktokglobalshop.com/api/v2/products/search`; 
    
    // Catatan: Idealnya Anda perlu menambahkan query string wajib (?app_key=${appKey}&timestamp=...&sign=...) sesuai SDK TikTok.
    const tiktokResponse = await fetch(TIKTOK_API_URL, {
      method: "POST", // 👈 Menggunakan POST sesuai dokumentasi Partner Center
      headers: {
        "x-tts-access-token": accessToken,
        "App-Key": appKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_keyword: cleanKeyword, // 👈 Payload body pencarian resmi TikTok
        page_size: 20
      }),
      cache: 'no-store' 
    });

    // 2. Cegah sirkuit putus. Jika TikTok melempar error (termasuk 404), tangkap dengan aman di sini
    if (!tiktokResponse.ok) {
      return NextResponse.json(
        { 
          error: `TikTok API merespons dengan error backend.`, 
          details: `Status Code dari TikTok: ${tiktokResponse.status}. Pastikan URL, Sign, dan Jago/BSI billing Anda aktif.` 
        }, 
        { status: 200 } // 👈 Sengaja mengembalikan status 200 agar rute Next.js tidak dicap 404 hancur oleh Vercel
      );
    }

    const typeofResponse = await tiktokResponse.text();
    if (!typeofResponse) {
      return NextResponse.json({ keyword: cleanKeyword, products: [], message: "Respon kosong dari TikTok." });
    }

    const tiktokData = JSON.parse(typeofResponse);

    if (!tiktokData || !tiktokData.data || !tiktokData.data.products || tiktokData.data.products.length === 0) {
      return NextResponse.json({
        keyword: cleanKeyword,
        generatedAt: new Date().toISOString(),
        products: [], 
        message: "Tidak ada produk yang ditemukan di TikTok Shop untuk kata kunci ini."
      });
    }

    const realProducts = tiktokData.data.products.map((prod: any) => {
      const priceMin = prod.price?.min_amount || 0;
      const priceMax = prod.price?.max_amount || 0;
      const sold30d = prod.sales_30d || 0;
      
      return {
        id: prod.product_id,
        productName: prod.product_name, 
        marketplace: "TikTok Shop",
        category: prod.category_name || "Uncategorized",
        priceMin: priceMin,
        priceMax: priceMax,
        sold30d: sold30d,
        revenue30d: sold30d * ((priceMin + priceMax) / 2), 
        growth30d: prod.growth_rate || 0,
        sellerCount: 1, 
        creatorCount: prod.affiliate_creator_count || 0, 
        videoCount: prod.related_video_count || 0,    
        adCount: prod.active_ads_count || 0,            
        avgRating: prod.review_rating || 0,            
        reviewCount: prod.review_count || 0,            
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
    // 3. Tangkap kegagalan fatal jaringan agar tidak berubah menjadi 404 global
    return NextResponse.json(
      { error: `Gagal terhubung ke jaringan TikTok Shop: ${error.message}` }, 
      { status: 500 }
    );
  }
}