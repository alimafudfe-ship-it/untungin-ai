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

    // LINK TERSTABIL UNTUK PUBLIC APP REGIONAL SE-ASIA TENGGARA
    const tokenUrl = "https://auth.tiktok-shops.com/api/v1/auth/token"; 
    
    const payload = {
      app_key: TIKTOK_APP_KEY,
      app_secret: TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: "authorized_code" 
    };

    console.log("Menukarkan token via Node.js murni untuk Untungin.ai...");
    
    // BACKUP STRATEGI: Jika JSON ditolak server, gunakan x-www-form-urlencoded bawaan partner global
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload)
    });

    const responseText = await tokenResponse.text();
    console.log("Response mentah dari Gateway TikTok:", responseText);

    if (!tokenResponse.ok) {
      throw new Error(`HTTP Error dari Gateway TikTok (Status: ${tokenResponse.status}). Konten: ${responseText.substring(0, 150)}`);
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`TikTok tidak mengembalikan skema JSON yang valid. Respons teks: ${responseText.substring(0, 200)}`);
    }

    // ANTISIPASI LOGIKA ERROR: Struktur data v1 memiliki skema property root 'code' dan 'message'
    if (tokenData.code !== 0 && tokenData.code !== undefined) {
      throw new Error(tokenData.message || `TikTok API Error (Code: ${tokenData.code})`);
    }

    // MEMBACA DATA TOKEN SECARA AMAN DARI STRUKTUR ROOT ATAU PROPERTY DATA
    const targetData = tokenData.data || tokenData;
    const accessToken = targetData.access_token;
    const refreshToken = targetData.refresh_token;
    const sellerName = targetData.seller_name || "Toko TikTok Resmi";
    const sellerId = targetData.seller_id;

    if (!accessToken) {
      throw new Error(`Gagal mem-parsing token akses. Struktur payload: ${JSON.stringify(tokenData)}`);
    }

    console.log(`Sukses mengintegrasikan Toko: ${sellerName} (ID: ${sellerId})`);
    if (workspaceId) {
      console.log(`Dihubungkan ke Workspace ID: ${workspaceId}`);
    }

    // ==============================================================================
    // TODO: Di area ini, jalankan fungsi DB Supabase kamu untuk mengamankan data token.
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
            <div style="background:#f1f5f9; padding:12px 16px; border-radius:8px; font-family:monospace; font-size:13px; color:#1e293b; overflow-x:auto; margin:16px 0;">
              ${error.message}
            </div>
            <hr style="border:0; border-top:1px solid #e2e8f0; margin:20px 0;"/>
            <p style="color:#64748b; font-size:14px; margin:0;">Silakan kembali ke dasbor utama <strong>Untungin.ai</strong> dan coba bersihkan cache browser sebelum mengulangi sinkronisasi.</p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}