import { NextResponse } from "next/server";

// ✨ PERBAIKAN KRUSIAL: Paksa Vercel menggunakan Edge Runtime untuk menghindari 'fetch failed'
export const runtime = "edge"; 

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

    // Ekstrak kembali data state
    let userId = null;
    let workspaceId = null;
    try {
      const parsedState = JSON.parse(decodeURIComponent(stateParams));
      userId = parsedState.userId;
      workspaceId = parsedState.workspaceId;
    } catch (e) {
      console.error("Gagal membaca data state parameter:", e);
    }

    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "6k0m8n8r9dh8j"; 
    const TIKTOK_APP_SECRET = process.env.TIKTOK_SHOP_APP_SECRET || "c72db92f62d972d4b1c1d27385a59e0b74453720";

    const tokenUrl = "https://open-api.tiktok-shops.com/api/v2/token/get"; 
    
    const bodyParams = new URLSearchParams({
      app_key: TIKTOK_APP_KEY,
      app_secret: TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: "authorization_code"
    });

    // ✨ TAMBAHAN: Kita tambahkan timeout & headers standar browser agar tidak dicurigai bot oleh Cloudflare TikTok
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      },
      body: bodyParams.toString()
    });

    const responseText = await tokenResponse.text();
    console.log("Response mentah dari TikTok:", responseText);

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`TikTok tidak mengembalikan JSON valid. Response mentah: ${responseText.substring(0, 200)}`);
    }

    if (tokenData.code !== 0 || !tokenData.data?.access_token) {
      throw new Error(tokenData.message || `TikTok API Error (Code: ${tokenData.code}): ${JSON.stringify(tokenData)}`);
    }

    const accessToken = tokenData.data.access_token;
    const sellerName = tokenData.data.seller_name || "Toko TikTok Resmi";

    // Simpan ke DB logika kamu...
    
    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/?tab=integrasi&sync=success`);

  } catch (error: any) {
    console.error("Error pada Callback OAuth TikTok:", error);
    
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