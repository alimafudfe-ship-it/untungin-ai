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
    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "6k0m8n8r9dh8j"; 
    const TIKTOK_APP_SECRET = process.env.TIKTOK_SHOP_APP_SECRET || "c72db92f62d972d4b1c1d27385a59e0b74453720";

    // Gunakan open-api endpoint resmi TikTok V2
    const tokenUrl = "https://open-api.tiktok-shops.com/api/v2/token/get"; 
    
    // ✨ PERBAIKAN: Bungkus data parameter ke URLSearchParams (Form Urlencoded)
    const bodyParams = new URLSearchParams({
      app_key: TIKTOK_APP_KEY,
      app_secret: TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: "authorization_code" // Menggunakan format "-ation" yang benar
    });

    console.log("Mengirim request penukaran token ke TikTok...");
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // ✨ PERBAIKAN: Ganti dari application/json
      },
      body: bodyParams.toString() // ✨ Kirim sebagai string query form data
    });

    // --- AMBIL TEKS MENTAH UNTUK DEBUGGING ---
    const responseText = await tokenResponse.text();
    console.log("Response mentah dari TikTok:", responseText);

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`TikTok tidak mengembalikan JSON valid. Response mentah: ${responseText.substring(0, 200)}`);
    }

    // Periksa respons error dari struktur data spesifik TikTok
    if (tokenData.code !== 0 || !tokenData.data?.access_token) {
      throw new Error(tokenData.message || `TikTok API Error (Code: ${tokenData.code}): ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.data.access_token;
    const refreshToken = tokenData.data.refresh_token;
    const sellerName = tokenData.data.seller_name || "Toko TikTok Resmi";
    const openId = tokenData.data.open_id; 

    // =========================================================
    // LOGIKA DATABASE SUPABASE KAMU DISINI:
    // Kamu bisa pakai accessToken & refreshToken untuk disimpan ke DB
    // =========================================================
    // console.log("Simpan token ke DB untuk Workspace:", workspaceId);
    // =========================================================

    console.log(`Sukses mengintegrasikan Toko Resmi TikTok: ${sellerName}`);

    // Lempar kembali browser pengguna ke dashboard utama dengan parameter sukses
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/?tab=integrasi&sync=success`);

  } catch (error: any) {
    console.error("Error pada Callback OAuth TikTok:", error);
    
    // Tampilkan error sejelas-jelasnya di browser agar kita tahu jika ada kendala jaringan/API
    return new NextResponse(
      `<html>
        <body style="font-family:sans-serif; padding:40px; line-height:1.6;">
          <h2 style="color:red;">🚨 Integrasi Tertahan (Gagal Tukar Token)</h2>
          <p><strong>Pesan Error:</strong> ${error.message}</p>
          <hr/>
          <p>Silakan kembalilah ke dashboard utama dan coba klik tombol integrasi sekali lagi untuk memicu token baru.</p>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}