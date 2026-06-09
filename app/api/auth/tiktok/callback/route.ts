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
    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "6k0m8n8r9dh8j"; // Sesuaikan dengan App Key di image_2a83b6.png
    const TIKTOK_APP_SECRET = process.env.TIKTOK_SHOP_APP_SECRET || "c72db92f62d972d4b1c1d27385a59e0b74453720";

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

    // --- PERBAIKAN UTAMA: AMBIL TEKS MENTAH TERLEBIH DAHULU ---
    const responseText = await tokenResponse.text();
    console.log("Response mentah dari TikTok:", responseText);

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      // Jika yang kembali bukan JSON (misal HTML error dari Cloudflare/TikTok)
      throw new Error(`TikTok tidak mengembalikan JSON valid. Response mentah: ${responseText.substring(0, 200)}`);
    }

    // Periksa respons error dari struktur data spesifik TikTok
    if (tokenData.code !== 0 || !tokenData.data?.access_token) {
      throw new Error(tokenData.message || `TikTok API Error (Code: ${tokenData.code}): ${tokenData.message}`);
    }

    const accessToken = tokenData.data.access_token;
    const refreshToken = tokenData.data.refresh_token;
    const sellerName = tokenData.data.seller_name || "Toko TikTok Resmi";
    const openId = tokenData.data.open_id; 

    // ==========================================
    // LOGIKA DATABASE SUPABASE KAMU DISINI:
    // ==========================================
    // console.log("Simpan token ke DB untuk Workspace:", workspaceId);
    // ==========================================

    console.log(`Sukses mengintegrasikan Toko Resmi TikTok: ${sellerName}`);

    // Lempar kembali browser pengguna ke dashboard utama dengan parameter sukses
    // Menggunakan URL absolut agar redirect Next.js stabil
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/?tab=integrasi&sync=success`);

  } catch (error: any) {
    console.error("Error pada Callback OAuth TikTok:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Gagal memproses pertukaran token TikTok Shop"
      },
      { status: 500 }
    );
  }
}