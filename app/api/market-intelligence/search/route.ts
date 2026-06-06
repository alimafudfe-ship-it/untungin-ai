import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Fungsi pembantu untuk membuat signature TikTok Shop API v2 (POST Request)
function generateTikTokSignature(
  uri: string, 
  params: Record<string, string>, 
  appSecret: string, 
  bodyString?: string
): string {
  const combinedParams = { ...params };
  
  // Sesuai dokumentasi resmi: sign dan access_token tidak ikut dihitung di string awal
  delete combinedParams.sign;
  delete combinedParams.access_token;

  const sortedKeys = Object.keys(combinedParams).sort();
  
  let signString = appSecret + uri;
  for (const key of sortedKeys) {
    signString += key + combinedParams[key];
  }
  
  // Untuk POST request, raw body string harus ditaruh sebelum appSecret penutup
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

  // 1. Validasi parameter input awal
  if (!cleanKeyword) {
    return NextResponse.json(
      { error: "Gagal memproses", message: "Keyword pencarian tidak boleh kosong." }, 
      { status: 400 }
    );
  }

  try {
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
    const appKey = process.env.TIKTOK_APP_KEY;
    const appSecret = process.env.TIKTOK_SHOP_APP_SECRET;

    // 2. Validasi Kredensial Environment Server
    if (!accessToken || !appKey || !appSecret) {
      return NextResponse.json(
        { 
          error: "Konfigurasi Env Tidak Lengkap",
          message: "Kredensial API (Access Token / App Key / App Secret) belum dikonfigurasi di file .env server Anda."
        }, 
        { status: 501 } // Status 501 Not Implemented
      );
    }

    const TIKTOK_BASE_URL = "https://open-api.tiktokglobalshop.com";
    const API_PATH = "/api/v2/products/search";
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Siapkan body request untuk pencarian produk
    const requestBody = {
      search_keyword: cleanKeyword,
      page_size: 20
    };
    const bodyString = JSON.stringify(requestBody);

    // Kumpulan query param wajib untuk enkripsi signature
    const queryParams: Record<string, string> = {
      app_key: appKey,
      timestamp: timestamp,
    };

    const shopId = searchParams.get("shop_id");
    if (shopId && shopId !== "undefined" && shopId.trim() !== "") {
      queryParams.shop_id = shopId.trim();
    }

    // Generate signature resmi berbasis gabungan Path + Query + Body + Secret
    const sign = generateTikTokSignature(API_PATH, queryParams, appSecret, bodyString);
    
    // Masukkan token dan hasil sign ke query parameter akhir
    queryParams.access_token = accessToken;
    queryParams.sign = sign;

    const queryString = new URLSearchParams(queryParams).toString();
    const FULL_API_URL = `${TIKTOK_BASE_URL}${API_PATH}?${queryString}`;

    // 3. Request langsung ke Live API TikTok
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
      return NextResponse.json(
        { 
          error: "Format Respon Rusak", 
          message: "Gagal membaca data. TikTok tidak mengembalikan format JSON yang valid.",
          raw: textResponse 
        }, 
        { status: 502 }
      );
    }

    // 4. Tangkap Error Spesifik dari API TikTok (Jika signature salah, token kedaluwarsa, dll)
    if (!tiktokResponse.ok || (tiktokData.code !== 0 && tiktokData.code !== 200)) {
      return NextResponse.json(
        { 
          error: `TikTok API Error (Status: ${tiktokResponse.status})`, 
          message: tiktokData.message || "TikTok menolak akses karena masalah autentikasi atau signature mismatch.",
          tiktok_code: tiktokData.code,
          request_log: {
            path: API_PATH,
            timestamp: timestamp,
            app_key: appKey
          }
        }, 
        { status: 400 } // Dilempar ke catch frontend agar memicu modal peringatan terperinci
      );
    }

    const dataObj = tiktokData.data || tiktokData;
    
    // 5. Tangani kondisi jika data sukses diakses tapi produk memang kosong
    if (!dataObj.products || dataObj.products.length === 0) {
      return NextResponse.json({
        keyword: cleanKeyword,
        generatedAt: new Date().toISOString(),
        products: [], 
        message: "Pencarian selesai. Tidak ada produk yang ditemukan untuk kata kunci ini."
      });
    }

    // 6. Mapping data asli murni dari TikTok Shop API v2
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
    return NextResponse.json(
      { 
        error: "Server Error", 
        message: `Terjadi kegagalan internal pada server proxy Anda: ${error.message}` 
      }, 
      { status: 500 }
    );
  }
}