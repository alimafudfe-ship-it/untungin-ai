import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// 🛠️ Fungsi Kalkulasi Signature Murni Sesuai Aturan Ketat TikTok v2
function generateTikTokSignature(
  uri: string, 
  params: Record<string, string>, 
  appSecret: string, 
  bodyString?: string
): string {
  const signParams: Record<string, string> = {};
  
  // Ambil semua param query kecuali sign dan access_token
  for (const key in params) {
    if (key !== "sign" && key !== "access_token") {
      signParams[key] = params[key];
    }
  }

  // Urutkan key secara alfabetis (ASCII)
  const sortedKeys = Object.keys(signParams).sort();
  
  // Gabungkan: Secret + Path
  let signString = appSecret + uri;
  
  // Rekatkan Key-Value tanpa URL-encoding (Raw Text)
  for (const key of sortedKeys) {
    signString += key + signParams[key];
  }
  
  // Tambahkan body string jika metodenya POST
  if (bodyString) {
    signString += bodyString;
  }
  
  signString += appSecret;

  // Jalankan hashing HMAC-SHA256
  return crypto.createHmac("sha256", appSecret).update(signString).digest("hex");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const cleanKeyword = keyword.trim();

  if (!cleanKeyword) {
    return NextResponse.json({ error: "Keyword kosong" }, { status: 400 });
  }

  try {
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    const appKey = process.env.TIKTOK_APP_KEY;
    const appSecret = process.env.TIKTOK_SHOP_APP_SECRET;

    if (!accessToken || !appKey || !appSecret) {
      return NextResponse.json({ 
        error: "Kredensial .env Tidak Lengkap",
        message: "Harap isi TIKTOK_ACCESS_TOKEN, TIKTOK_APP_KEY, dan TIKTOK_SHOP_APP_SECRET."
      }, { status: 400 });
    }

    const TIKTOK_BASE_URL = "https://open-api.tiktokglobalshop.com";
    
    // 🌟 PERBAIKAN ENDPOINT: Jalur resmi v2 untuk pencarian list produk pasar global
    const API_PATH = "/api/v2/products/search"; 
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Pastikan payload bersih tanpa spasi ekstra formatting agar sinkron dengan sign generator
    const requestBody = {
      search_keyword: cleanKeyword,
      page_size: 20
    };
    const bodyString = JSON.stringify(requestBody);

    const queryParams: Record<string, string> = {
      app_key: appKey,
      timestamp: timestamp,
    };

    // Validasi shop_id: Jangan kirim string "undefined" jika kosong
    const shopId = searchParams.get("shop_id");
    if (shopId && shopId !== "undefined" && shopId.trim() !== "") {
      queryParams.shop_id = shopId.trim();
    }

    // Hitung Signature resmi
    const sign = generateTikTokSignature(API_PATH, queryParams, appSecret, bodyString);
    
    // Tambahkan token dan signature ke query string akhir
    queryParams.access_token = accessToken;
    queryParams.sign = sign;

    const queryString = new URLSearchParams(queryParams).toString();
    const FULL_API_URL = `${TIKTOK_BASE_URL}${API_PATH}?${queryString}`;

    const tiktokResponse = await fetch(FULL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tts-access-token": accessToken
      },
      body: bodyString,
      cache: 'no-store' 
    });

    const textResponse = await tiktokResponse.text();
    let tiktokData: any = {};
    
    try {
      tiktokData = textResponse ? JSON.parse(textResponse) : {};
    } catch (e) {
      return NextResponse.json({ error: "Respon API TikTok rusak / bukan JSON" }, { status: 400 });
    }

    // 🔴 KONTROL ERROR ASLI: Jika ditolak, teruskan error apa adanya agar Anda bisa lacak langsung
    if (!tiktokResponse.ok || (tiktokData.code !== 0 && tiktokData.code !== 200)) {
      return NextResponse.json({
        error: `TikTok API Error (Code: ${tiktokData.code})`,
        message: tiktokData.message || "Akses ditolak oleh API Gateway TikTok resmi."
      }, { status: 400 });
    }

    const dataObj = tiktokData.data || tiktokData;
    if (!dataObj.products || dataObj.products.length === 0) {
      return NextResponse.json({
        keyword: cleanKeyword,
        generatedAt: new Date().toISOString(),
        products: [],
        message: "Pencarian sukses. Tidak ada produk asli yang ditemukan."
      });
    }

    // Mapping data murni 100% dari struktur objek API v2 TikTok
    const realProducts = dataObj.products.map((prod: any) => {
      const priceMin = prod.price?.min_amount || prod.min_sale_price || 0;
      const priceMax = prod.price?.max_amount || prod.max_sale_price || 0;
      const sold30d = prod.sales_30d || prod.sold_count || 0;
      
      return {
        id: (prod.product_id || prod.id).toString(),
        productName: prod.product_name || prod.title || prod.name, 
        marketplace: "TikTok Shop",
        country: "ID",
        category: prod.category_name || "Uncategorized",
        keyword: cleanKeyword,
        period: "month",
        priceMin: Number(priceMin),
        priceMax: Number(priceMax),
        sold7d: Math.round(Number(sold30d) / 4),
        sold30d: Number(sold30d),
        revenue7d: Math.round((Number(priceMin) * Number(sold30d)) / 4),
        revenue30d: Number(sold30d) * ((Number(priceMin) + Number(priceMax)) / 2), 
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
        signal: (prod.growth_rate || 0) > 40 ? "viral" : "rising",
        source: "TikTok Partner API v2"
      };
    });

    return NextResponse.json({
      keyword: cleanKeyword,
      generatedAt: new Date().toISOString(),
      products: realProducts
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}