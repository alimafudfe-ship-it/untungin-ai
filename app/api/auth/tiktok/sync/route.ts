import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// 1. Ambil nilai env atau gunakan string tiruan sementara agar tidak crash saat build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key-for-build-purposes';

// 2. Inisialisasi aman dari error "supabaseKey is required"
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Fungsi resmi pembuat Signature sesuai standar dokumentasi TikTok Shop API.
 * Mengurutkan query secara alfabetis, menggabungkannya dengan path dan secret, lalu di-hash menggunakan HMAC-SHA256.
 */
function generateTikTokSignature(path: string, queries: Record<string, string>, secret: string): string {
  const keys = Object.keys(queries).sort();
  let signString = path;
  
  for (const key of keys) {
    signString += key + queries[key];
  }
  
  signString = secret + signString + secret;
  
  return crypto
    .createHmac('sha256', secret)
    .update(signString)
    .digest('hex');
}

export async function GET(request: Request) {
  try {
    // 1. Ambil storeId dari URL query parameter frontend
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ success: false, message: "Store ID wajib dicantumkan" }, { status: 400 });
    }

    // 2. Tarik data koneksi toko dari database Supabase
    const { data: connections, error: dbError } = await supabase
      .from('marketplace_connections')
      .select('*') 
      .eq('id', storeId);

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return NextResponse.json({ success: false, message: `Database Error: ${dbError.message}` }, { status: 500 });
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Koneksi dengan ID Toko (${storeId}) tidak ditemukan di Supabase. Harap periksa kembali baris data Anda.` 
      }, { status: 404 });
    }

    const connectionData = connections[0];
    
    // Mengambil access token asli dari kolom database
    const accessToken = connectionData.access_token || connectionData.token;

    if (!accessToken || accessToken === 'test_token' || accessToken.includes('-')) {
      return NextResponse.json({ 
        success: false, 
        message: "Akses ditolak: Nilai 'access_token' di Supabase Anda tidak valid atau masih berupa template data coba-coba (UUID)." 
      }, { status: 401 });
    }

    // 3. Kredensial Baru Hasil Pembuatan di TikTok Partner Center Anda
    const appKey = "6k9tqhh1i366s";
    const appSecret = "b0edb9990afd61f40c7d704f6e7cdaa0bcdd5809"; 
    
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const apiPath = '/product/202309/products'; 
    const tiktokEndpoint = `https://open-api.tiktokglobalshop.com${apiPath}`;

    // 4. Susun object query yang wajib masuk hitungan signature TikTok
    const queriesForSign: Record<string, string> = {
      access_token: accessToken,
      app_key: appKey,
      timestamp: timestamp,
    };

    const signature = generateTikTokSignature(apiPath, queriesForSign, appSecret);

    // 5. Susun URL Fetch final lengkap beserta query string parameter-nya
    const urlWithParams = new URL(tiktokEndpoint);
    urlWithParams.searchParams.append('access_token', accessToken);
    urlWithParams.searchParams.append('app_key', appKey);
    urlWithParams.searchParams.append('timestamp', timestamp);
    urlWithParams.searchParams.append('sign', signature);

    // 6. Request data ke API Utama TikTok Shop menggunakan metode POST sesuai dokumentasi terbaru
    const tiktokResponse = await fetch(urlWithParams.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tts-access-token': accessToken
      },
      body: JSON.stringify({
        page_size: 20,
        status: "ACTIVATE" 
      })
    });

    const tiktokData = await tiktokResponse.json();

    // Jika server TikTok menolak request, kirim log transparan ke interface web biar mudah dibaca
    if (tiktokData.code !== 0) {
      console.error("====== TIKTOK API ERROR LOG ======");
      console.error(tiktokData);
      return NextResponse.json({ 
        success: false, 
        message: `TikTok API Error: ${tiktokData.message} (Code: ${tiktokData.code}). Request ID: ${tiktokData.request_id || 'N/A'}` 
      }, { status: 500 });
    }

    // 7. Format ulang data produk mentah dari TikTok agar pas dengan UI Dashboard Untungin.ai
    const rawProducts = tiktokData.data?.products || [];
    const formattedProducts = rawProducts.map((prod: any) => ({
      id: prod.id,
      name: prod.title,
      price: prod.skus?.[0]?.price?.sale_price || 0, 
      stock: prod.skus?.[0]?.stock?.available_stock || 0
    }));

    return NextResponse.json({
      success: true,
      message: "Sinkronisasi data produk TikTok berhasil terhubung!",
      products: formattedProducts
    });

  } catch (error: any) {
    console.error("Crash terjadi pada API Sync:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 });
  }
}