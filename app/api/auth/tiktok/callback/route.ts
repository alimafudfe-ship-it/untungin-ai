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
        console.warn("State bukan JSON terenkripsi, membaca sebagai string biasa.");
      }
    }

    const TIKTOK_APP_KEY = process.env.NEXT_PUBLIC_TIKTOK_APP_KEY || "6k9tqhh1i366s"; 
    const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET || "b0edb9990afd61f40c7d704f6e7cdaa0bcdd5809";

    // LINK ENDPOINT TERBAIK UNTUK SERVICES PUBLIC MARKET APP V1
    const tokenUrl = "https://auth.tiktok-shops.com/api/v1/auth/token"; 
    
    // FORMAT UTAMA: Menggunakan URLSearchParams agar lolos validasi Gateway API TikTok Indonesia
    const bodyPayload = new URLSearchParams({
      app_key: TIKTOK_APP_KEY,
      app_secret: TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: "authorized_code" 
    });

    console.log("Menukarkan token via URLSearchParams Form untuk Untungin.ai...");
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // STANDAR UTAMA OAUTH V1 PUBLIC APP
        "Accept": "application/json",
      },
      body: bodyPayload.toString()
    });

    const responseText = await tokenResponse.text();
    console.log("Response asli dari server TikTok:", responseText);

    if (!tokenResponse.ok) {
      throw new Error(`HTTP Error dari Gateway TikTok (Status: ${tokenResponse.status}). Konten: ${responseText || 'Kosong'}`);
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Gagal membaca JSON. Respons mentah server: ${responseText.substring(0, 200) || 'Kosong (Kemungkinan masalah SSL/CORS Gateway)'}`);
    }

    // MENANGKAP ERROR BUSINESS LOGIC DARI TIKTOK
    if (tokenData.code !== 0 && tokenData.code !== undefined) {
      throw new Error(tokenData.message || `TikTok API Error (Code: ${tokenData.code})`);
    }

    // MAP DATA SECARA FLEKSIBEL (BAIK MAUPUN TANPA WRAPPER .DATA)
    const targetData = tokenData.data || tokenData;
    const accessToken = targetData.access_token;
    const refreshToken = targetData.refresh_token;
    const sellerName = targetData.seller_name || "Toko TikTok Resmi";
    const sellerId = targetData.seller_id;

    if (!accessToken) {
      throw new Error(`Token akses tidak ditemukan dalam payload respons: ${JSON.stringify(tokenData)}`);
    }

    console.log(`Sukses mengintegrasikan Toko: ${sellerName} (ID: ${sellerId})`);
    if (workspaceId) {
      console.log(`Dihubungkan ke Workspace ID: ${workspaceId}`);
    }

    // ==============================================================================
    // TODO: Di area ini, jalankan fungsi DB Supabase kamu untuk menyimpan data token.
    // ==============================================================================

    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/?tab=integrasi&sync=success`);

  } catch (error: any) {
    console.error("Error pada Callback OAuth TikTok:", error);
    return new NextResponse(
      `<html>
        <body style="font-family:sans-serif; padding:40px; line-height:1.6; background-color:#fafafa;">
          <div style="max-width:600px; margin: 40px auto; background:#fff; padding:30px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.05); border-top: 4px solid #ef4444;">
            <h2 style="color:#ef4444; margin-top:0; display:flex; align-items:center; gap:8px;">🚨 Integrasi Tertahan (Gagal Tukar Token)</h2>
            <p>Sistem otorisasi gagal memproses penukaran token rahasia dari pihak aplikasi pihak ketiga TikTok.</p>
            <div style="background:#f1f5f9; padding:12px 16px; border-radius:8px; font-family:monospace; font-size:13px; color:#1e293b; overflow-x:auto; margin:16px 0; white-space: pre-wrap;">
              ${error.message}
            </div>
            <hr style="border:0; border-top:1px solid #e2e8f0; margin:20px 0"/>
            <p style="color:#64748b; font-size:14px; margin:0;">Silakan kembali ke dasbor utama <strong>Untungin.ai</strong> dan coba klik tombol integrasi ulang.</p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}