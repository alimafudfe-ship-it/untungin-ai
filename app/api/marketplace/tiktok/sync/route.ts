// File: ./app/api/marketplace/tiktok/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Fungsi Pembuat Signature TikTok V2 yang Akurat
function generateTikTokSignature(apiPath: string, params: Record<string, any>, appSecret: string): string {
  // 1. Ambil semua kunci selain 'sign' dan 'access_token'
  const keys = Object.keys(params).filter(key => key !== 'sign').sort();
  
  // 2. Susun string: app_secret + path + k1+v1 + k2+v2 + app_secret
  let signString = appSecret + apiPath;
  for (const key of keys) {
    signString += key + params[key];
  }
  signString += appSecret;

  // 3. HMAC-SHA256
  return crypto
    .createHmac("sha256", appSecret)
    .update(signString)
    .digest("hex");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("storeId");

    if (!storeId || storeId === "tes") {
      return NextResponse.json({ ok: false, error: "Gagal sync: Parameter storeId tiruan ('tes') tidak valid." }, { status: 200 });
    }

    // 1. Ambil Kredensial Toko Riil dari Supabase (Ditambahkan mengambil 'user_id')
    const { data: activeStore, error: dbError } = await supabase
      .from("store_connections") 
      .select("access_token, tiktok_shop_id, user_id") // ✨ Menarik 'user_id' pemilik toko
      .eq("id", storeId)
      .single();

    if (dbError || !activeStore) {
      return NextResponse.json({ ok: false, error: "Kredensial toko tidak ditemukan di database Anda." }, { status: 200 });
    }

    const appKey = "6k0m8n8r9dh8j";
    const appSecret = "c72db92f62d972d4b1c1d27385a59e0b74453720";
    
    // PATH RESMI TIKTOK SHOP API V2 UNTUK DAFTAR PRODUK TOKO
    const apiPath = "/api/product/202309/products"; 
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // 2. Definisikan Common Query Parameters (Wajib masuk URL)
    const queryParams: Record<string, string> = {
      access_token: activeStore.access_token,
      app_key: appKey,
      shop_id: activeStore.tiktok_shop_id, 
      timestamp: timestamp,
      version: "202309" 
    };

    // 3. Hitung Signature
    const signature = generateTikTokSignature(apiPath, queryParams, appSecret);
    queryParams.sign = signature;

    // 4. Bangun URL Endpoint
    const finalUrl = new URL(`https://open-api.tiktokglobalshop.com${apiPath}`);
    Object.keys(queryParams).forEach((key) => finalUrl.searchParams.append(key, queryParams[key]));

    console.log(`[TikTok Sync V2] Meminta Akses Jaringan: ${finalUrl.toString()}`);

    // 5. Kirim HTTP POST Request ke TikTok
    const tiktokResponse = await fetch(finalUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_size: 20,
        status: "ACTIVATE" 
      })
    });

    // Validasi format respons jika terjadi kendala jaringan proxy
    const contentType = tiktokResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textError = await tiktokResponse.text();
      console.error("❌ Respons Server Bukan JSON:", textError);
      return NextResponse.json({ ok: false, error: "Server TikTok mengembalikan format non-JSON (Gagal Server)." }, { status: 200 });
    }

    const responseData = await tiktokResponse.json();

    if (responseData.code !== 0) {
      console.error("❌ Eror Spesifik dari Gerbang TikTok:", responseData);
      return NextResponse.json({
        ok: false,
        error: `TikTok API Error (${responseData.code}): ${responseData.message}`
      }, { status: 200 });
    }

// =================================================================
// 💾 PROSES MENYIMPAN DATA DATA KE DATABASE SUPABASE VIA UPSERT
// =================================================================
const tiktokProducts = responseData.data?.products || [];
let mappedDashboardProducts: any[] = [];

if (tiktokProducts.length > 0) {
  // 1. Petakan data untuk kebutuhan penyimpanan live sync marketplace
  const productsToUpsert = tiktokProducts.map((prod: any) => {
    const firstPriceInfo = prod.skus?.[0]?.price || {};
    return {
      user_id: activeStore.user_id,
      shop_id: activeStore.tiktok_shop_id,
      product_id: prod.id,
      provider: "tiktok",
      title: prod.title || "Produk TikTok Tanpa Nama",
      price: Number(firstPriceInfo.sale_price || firstPriceInfo.original_price || 0),
      stock: Number(prod.skus?.[0]?.stock_infos?.[0]?.available_stock || 0)
    };
  });

  const { error: insertError } = await supabase
    .from("marketplace_products_live")
    .upsert(productsToUpsert, { onConflict: "product_id" });

  if (insertError) {
    console.error("❌ Gagal menyimpan data sinkronisasi ke Supabase:", insertError);
    return NextResponse.json({ ok: false, error: `Gagal menyimpan data ke database lokal: ${insertError.message}` }, { status: 200 });
  }

  // 2. 🌟 KUNCI UTAMA: Petakan data TikTok langsung ke struktur tipe data "Product" internal Untungin.ai 
  // Agar ketika diset di frontend melalui setProducts(), dashboard tidak hancur/blank!
  mappedDashboardProducts = tiktokProducts.map((prod: any, index: number) => {
    const firstSku = prod.skus?.[0] || {};
    const sellingPrice = Number(firstSku.price?.sale_price || firstSku.price?.original_price || 0);
    // Estimasi HPP default 60% dari harga jual sebagai fallback awal data yang baru masuk
    const costPrice = sellingPrice * 0.6; 
    const stockRemaining = Number(firstSku.stock_infos?.[0]?.available_stock || 0);
    const quantitySold = 0; // Data produk baru tersinkronisasi dianggap awal
    const otherCost = 0;
    
    // Perhitungan bisnis standar aplikasi Untungin.ai
    const profit = (sellingPrice - costPrice) * quantitySold - otherCost;
    const margin = sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0;

    return {
      id: prod.id || `tt-synced-${index}`,
      name: prod.title || "Produk TikTok Tanpa Nama",
      costPrice: costPrice,
      sellingPrice: sellingPrice,
      stockInitial: stockRemaining + quantitySold,
      stockRemaining: stockRemaining,
      quantitySold: quantitySold,
      otherCost: otherCost,
      profit: profit,
      margin: margin,
      marketplace: "TikTok"
    };
  });
}

// 🌟 Mengembalikan respons sukses terstruktur ke frontend dashboard Anda
return NextResponse.json({
  ok: true,
  message: "Sukses! Data produk dan transaksi TikTok Shop berhasil diselaraskan.",
  products: mappedDashboardProducts, // <-- Sekarang mengirimkan data yang sudah kompatibel dengan Frontend!
  syncedCount: mappedDashboardProducts.length
});