import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const code = searchParams.get("auth_code") || searchParams.get("code");
    const stateParams = searchParams.get("state") || "";

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Otorisasi dibatalkan atau auth_code tidak ditemukan." }, 
        { status: 400 }
      );
    }

    // MEMBONGKAR DATA STATE SECARA AMAN
    let workspaceId = null;
    if (stateParams) {
      try {
        const decodedState = decodeURIComponent(stateParams);
        const parsedState = JSON.parse(decodedState);
        workspaceId = parsedState.workspaceId || null;
      } catch (e) {
        console.warn("State bukan JSON terenkripsi, membaca sebagai string biasa atau dilewati.");
      }
    }

    // Menyesuaikan dengan kunci .env.local yang ada di gambar image_45c1e3.png kamu
    const TIKTOK_APP_KEY = process.env.NEXT_PUBLIC_TIKTOK_APP_KEY || "6k9tqhh1i366s"; 
    const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET || "b0edb9990afd61f40c7d704f6e7cdaa0bcdd5809";

// 1. ENDPOINT RESMI UNTUK PUBLIC APP TIKTOK SHOP GLOBAL
    const tokenUrl = "https://auth.tiktok-shops.com/api/v1/auth/token"; 
    
    // 2. DATA PAYLOAD UNTUK PUBLIC APP OAUTH
    const searchValues = {
      app_key: TIKTOK_APP_KEY,
      app_secret: TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: "authorized_code" // PENTING: Untuk v1 nilainya "authorized_code", bukan "authorization_code"
    };

    console.log("Menukarkan token via Node.js standar untuk Aplikasi Publik Untungin.ai...");
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // DIUBAH: Menggunakan JSON murni untuk endpoint v1
        "Accept": "application/json",
      },
      body: JSON.stringify(searchValues) // DIUBAH: Menggunakan JSON.stringify
    });

    const responseText = await tokenResponse.text();
    console.log("Response mentah dari TikTok:", responseText);

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`TikTok tidak mengembalikan JSON valid. Response mentah: ${responseText.substring(0, 200)}`);
    }

    // Validasi response token dari struktur API TikTok v2
    if (tokenData.code !== 0 || !tokenData.data?.access_token) {
      throw new Error(tokenData.message || `TikTok API Error (Code: ${tokenData.code}): ${JSON.stringify(tokenData)}`);
    }

    // DATA UTAMA YANG BERHASIL DIDAPATKAN
    const accessToken = tokenData.data.access_token;
    const refreshToken = tokenData.data.refresh_token;
    const sellerName = tokenData.data.seller_name || "Toko TikTok Resmi";
    const sellerId = tokenData.data.seller_id;

    console.log(`Sukses mengintegrasikan Toko: ${sellerName} (ID: ${sellerId})`);
    if (workspaceId) {
      console.log(`Dihubungkan ke Workspace ID: ${workspaceId}`);
    }

    // ==============================================================================
    // TODO: Di area ini, lakukan query INSERT/UPDATE ke database Supabase kamu
    // untuk menyimpan accessToken & refreshToken agar sistem backend bisa menarik data.
    // ==============================================================================

    const baseUrl = new URL(request.url).origin;
    // Mengarahkan kembali ke halaman integrasi dengan parameter sukses
    return NextResponse.redirect(`${baseUrl}/?tab=integrasi&sync=success`);

  } catch (error: any) {
    console.error("Error pada Callback OAuth TikTok:", error);
    return new NextResponse(
      `<html>
        <body style="font-family:sans-serif; padding:40px; line-height:1.6; background-color:#fafafa;">
          <div style="max-width:600px; margin: 0 auto; background:#fff; padding:30px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <h2 style="color:#ef4444; margin-top:0; display:flex; align-items:center; gap:8px;">🚨 Integrasi Tertahan (Gagal Tukar Token)</h2>
            <p><strong>Pesan Masalah:</strong> <span style="color:#334155;">${error.message}</span></p>
            <hr style="border:0; border-top:1px solid #e2e8f0; margin:20px 0;"/>
            <p style="color:#64748b; font-size:14px;">Silakan tutup halaman ini, kembali ke dashboard utama <strong>Untungin.ai</strong>, lalu coba klik tombol integrasi ulang.</p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}