import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function generateTikTokSignature(
  uri: string, 
  params: Record<string, string>, 
  appSecret: string, 
  bodyString?: string
): string {
  const signParams: Record<string, string> = {};
  for (const key in params) {
    if (key !== "sign" && key !== "access_token") {
      signParams[key] = params[key];
    }
  }
  const sortedKeys = Object.keys(signParams).sort();
  let signString = appSecret + uri;
  for (const key of sortedKeys) {
    signString += key + signParams[key];
  }
  if (bodyString) {
    signString += bodyString;
  }
  signString += appSecret;
  return crypto.createHmac("sha256", appSecret).update(signString).digest("hex");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") || "";
  const cleanKeyword = keyword.trim();

  // Jika keyword kosong, berikan satu item info di UI agar tidak memicu alert crash
  if (!cleanKeyword) {
    return NextResponse.json({
      keyword: "Kosong",
      generatedAt: new Date().toISOString(),
      products: [{
        id: "err-1",
        productName: "⚠️ Peringatan: Kata kunci pencarian kosong.",
        marketplace: "Sistem",
        category: "Error Input",
        priceMin: 0, priceMax: 0, sold30d: 0, revenue30d: 0
      }]
    }, { status: 200 });
  }

  try {
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    const appKey = process.env.TIKTOK_APP_KEY;
    const appSecret = process.env.TIKTOK_SHOP_APP_SECRET;

    // Jika ENV bermasalah, selundupkan pesan ke dalam tabel UI
    if (!accessToken || !appKey || !appSecret) {
      return NextResponse.json({
        keyword: cleanKeyword,
        generatedAt: new Date().toISOString(),
        products: [{
          id: "err-env",
          productName: `❌ Kredensial .env Tidak Lengkap (Token: ${accessToken ? 'Aman' : 'Hilang'}, Key: ${appKey ? 'Aman' : 'Hilang'}, Secret: ${appSecret ? 'Aman' : 'Hilang'})`,
          marketplace: "TikTok Shop",
          category: "Setup Error",
          priceMin: 0, priceMax: 0, sold30d: 0, revenue30d: 0
        }]
      }, { status: 200 });
    }

    const TIKTOK_BASE_URL = "https://open-api.tiktokglobalshop.com";
    const API_PATH = "/api/v2/products/search";
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const requestBody = {
      search_keyword: cleanKeyword,
      page_size: 20
    };
    const bodyString = JSON.stringify(requestBody);

    const queryParams: Record<string, string> = {
      app_key: appKey,
      timestamp: timestamp,
    };

    const shopId = searchParams.get("shop_id");
    if (shopId && shopId !== "undefined" && shopId.trim() !== "") {
      queryParams.shop_id = shopId.trim();
    }

    const sign = generateTikTokSignature(API_PATH, queryParams, appSecret, bodyString);
    
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
      return NextResponse.json({
        keyword: cleanKeyword,
        generatedAt: new Date().toISOString(),
        products: [{
          id: "err-json",
          productName: "❌ Respon TikTok rusak (Bukan format JSON valid)",
          marketplace: "TikTok Shop",
          category: "Format Error",
          priceMin: 0, priceMax: 0, sold30d: 0, revenue30d: 0
        }]
      }, { status: 200 });
    }

    // 🛠️ TRICK UTAMA: Jika TikTok menolak/Error 400, bungkus errornya menjadi data produk buatan
    // Ini menjamin status HTTP murni tetap 200, alert hitam hilang, dan teks error tercetak di komponen UI Anda!
    if (!tiktokResponse.ok || (tiktokData.code !== 0 && tiktokData.code !== 200)) {
      return NextResponse.json({
        keyword: cleanKeyword,
        generatedAt: new Date().toISOString(),
        products: [{
          id: "err-tiktok-api",
          productName: `❌ TIKTOK REJECTED (Code: ${tiktokData.code}) -> Message: ${tiktokData.message || 'Signature / Token Tidak Valid'}`,
          marketplace: "TikTok Shop",
          category: "API Auth Error",
          priceMin: 0,
          priceMax: 0,
          sold30d: 0,
          revenue30d: 0,
          notes: "Silakan periksa kembali kecocokan TIKTOK_SHOP_APP_SECRET dan pastikan Access Token belum expired."
        }]
      }, { status: 200 }); // Status dipaksa 200 agar lolos dari jeratan catch frontend!
    }

    const dataObj = tiktokData.data || tiktokData;
    if (!dataObj.products || dataObj.products.length === 0) {
      return NextResponse.json({
        keyword: cleanKeyword,
        generatedAt: new Date().toISOString(),
        products: [],
        message: "Tidak ada produk asli yang ditemukan."
      });
    }

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
    // Jika ada crash sistem server, tampilkan juga sebagai row di tabel
    return NextResponse.json({
      keyword: cleanKeyword,
      generatedAt: new Date().toISOString(),
      products: [{
        id: "err-fatal",
        productName: `❌ Internal Proxy Error: ${error.message}`,
        marketplace: "Local Server",
        category: "Crash",
        priceMin: 0, priceMax: 0, sold30d: 0, revenue30d: 0
      }]
    }, { status: 200 });
  }
}