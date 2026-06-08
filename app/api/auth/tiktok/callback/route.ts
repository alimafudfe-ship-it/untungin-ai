import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // TikTok mengirimkan 'auth_code' setelah seller menyetujui otorisasi
    const code = searchParams.get("auth_code") || searchParams.get("code");
    const stateParams = searchParams.get("state") || "";

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Otorisasi dibatalkan atau auth_code tidak ditemukan." }, 
        { status: 400 }
      );
    }

    // Ekstrak kembali userId dan workspaceId dari state parameter
    let userId = null;
    let workspaceId = null;
    try {
      const parsedState = JSON.parse(decodeURIComponent(stateParams));
      userId = parsedState.userId;
      workspaceId = parsedState.workspaceId;
    } catch (e) {
      console.error("Gagal membaca data state parameter:", e);
    }

    console.log(`Menerima auth code dari TikTok. Menukarkan token untuk Workspace: ${workspaceId}`);

    // Ambil kredensial aplikasi Untungin.ai kamu
    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "MASUKKAN_APP_KEY_TIKTOK_KAMU_DISINI";
    const TIKTOK_APP_SECRET = process.env.TIKTOK_SHOP_APP_SECRET || "MASUKKAN_APP_SECRET_TIKTOK_KAMU_DISINI";

    // PERBAIKAN: Hit ke TikTok menggunakan POST dan kirim parameter dalam bentuk JSON Body
    const tokenUrl = "https://auth.tiktok-shops.com/api/v2/token/get";
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_key: TIKTOK_APP_KEY,
        app_secret: TIKTOK_APP_SECRET,
        auth_code: code,
        grant_type: "authorized_code"
      })
    });

    const tokenData = await tokenResponse.json();

    // Periksa respons error dari struktur data spesifik TikTok
    if (tokenData.code !== 0 || !tokenData.data?.access_token) {
      throw new Error(tokenData.message || `TikTok API Error: ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.data.access_token;
    const refreshToken = tokenData.data.refresh_token;
    const sellerName = tokenData.data.seller_name || "Toko TikTok Resmi";
    const openId = tokenData.data.open_id; // ID unik internal toko di TikTok

    // ==========================================
    // LOGIKA DATABASE SUPABASE KAMU DISINI:
    // ==========================================
    // Simpan accessToken, refreshToken, dan openId ini agar sistem bisa menarik data produk
    // console.log("Simpan token ke DB untuk Workspace:", workspaceId);
    // ==========================================

    console.log(`Sukses mengintegrasikan Toko Resmi TikTok: ${sellerName}`);

    // Lempar kembali browser pengguna ke dashboard utama dengan parameter sukses
    return NextResponse.redirect(new URL("/?tab=integrasi&sync=success", request.url));

  } catch (error: any) {
    console.error("Error pada Callback OAuth TikTok:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses pertukaran token TikTok Shop" },
      { status: 500 }
    );
  }
}