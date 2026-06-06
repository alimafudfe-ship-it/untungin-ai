import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto"; // Digunakan untuk generate signature resmi TikTok

// Fungsi pembantu untuk membuat signature TikTok Shop API
function generateTikTokSignature(uri: string, params: Record<string, string>, appSecret: string): string {
  const combinedParams = { ...params };
  const sortedKeys = Object.keys(combinedParams).sort();
  
  let signString = appSecret + uri;
  for (const key of sortedKeys) {
    signString += key + combinedParams[key];
  }
  signString += appSecret;

  return crypto.createHmac("sha256", appSecret).update(signString).digest("hex");
}

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
    const appSecret = process.env.TIKTOK_SHOP_APP_SECRET; // 👈 Diubah agar membaca TIKTOK_SHOP_APP_SECRET dari image_3936aa.png

    if (!accessToken || !appKey || !appSecret) {
  return NextResponse.json(
    { 
      error: "Konfigurasi Env Tidak Lengkap",
      details: {
        accessToken: accessToken ? "Terpasang" : "Hilang",
        appKey: appKey ? "Terpasang" : "Hilang",
        appSecret: appSecret ? "Terpasang" : "Hilang"
      }
    }, 
    { status: 501 }
  );
}

    const TIKTOK_BASE_URL = "https://open-api.tiktokglobalshop.com";
    const API_PATH = "/api/v2/products/search";
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // 1. Parameter Wajib URL Query untuk TikTok Partner API v2
    const queryParams: Record<string, string> = {
      app_key: appKey,
      access_token: accessToken,
      timestamp: timestamp,
      shop_id: searchParams.get("shop_id") || "", // Tambahkan jika riset spesifik per toko
    };

    // Bersihkan query param yang kosong
    Object.keys(queryParams).forEach(key => !queryParams[key] && delete queryParams[key]);

    // 2. Generate Signature Resmi
    const sign = generateTikTokSignature(API_PATH, queryParams, appSecret);
    queryParams.sign = sign;

    const queryString = new URLSearchParams(queryParams).toString();
    const FULL_API_URL = `${TIKTOK_BASE_URL}${API_PATH}?${queryString}`;

    const tiktokResponse = await fetch(FULL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_keyword: cleanKeyword,
        page_size: 20
      }),
      cache: 'no-store' 
    });

    // Ambil response berupa teks untuk menghindari crash saat parsing JSON
    const textResponse = await tiktokResponse.text();
    let tiktokData: any = {};
    
    try {
      tiktokData = textResponse ? JSON.parse(textResponse) : {};
    } catch (e) {
      return NextResponse.json({ error: "Format respon dari TikTok bukan JSON valid.", raw: textResponse }, { status: 502 });
    }

    // 3. Jika TikTok merespon dengan error, kirim ke frontend dengan status error yang jelas!
    if (!tiktokResponse.ok || tiktokData.code !== 0) {
      return NextResponse.json(
        { 
          error: `TikTok API Error (Code: ${tiktokData.code || tiktokResponse.status})`, 
          message: tiktokData.message || "Gagal mendapatkan data valid dari TikTok Partner Center."
        }, 
        { status: 400 } // Frontend akan menangkap ini sebagai error di blok .catch() atau state loading error
      );
    }

    if (!tiktokData.data || !tiktokData.data.products || tiktokData.data.products.length === 0) {
      return NextResponse.json({
        keyword: cleanKeyword,
        generatedAt: new Date().toISOString(),
        products: [], 
        message: "Tidak ada produk yang ditemukan untuk kata kunci ini."
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
    return NextResponse.json(
      { error: `Gagal terhubung ke jaringan TikTok Shop: ${error.message}` }, 
      { status: 500 }
    );
  }
}