import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Tangkap kode otorisasi dari parameter URL TikTok
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
        console.warn("State bukan JSON terenkripsi, dilewati.");
      }
    }

    // Kredensial asli aplikasi Public Untungin.ai kamu
    const TIKTOK_APP_KEY = process.env.NEXT_PUBLIC_TIKTOK_APP_KEY || process.env.TIKTOK_SHOP_APP_KEY || "6k9tqhh1i366s"; 
    const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET || "b0edb9990afd61f40c7d704f6e7cdaa0bcdd5809";

    // 🛠️ DOMAIN UTAMA PALING STABIL (Solusi untuk mengatasi Fetch Failed)
    const tokenUrl = "https://open-api.tiktok.com/api/v2/token/get"; 
    
    // Payload wajib berbentuk Objek JSON murni untuk API V2 Publik
    const payload = {
      app_key: TIKTOK_APP_KEY,
      app_secret: TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: "authorized_code"
    };

    console.log("Mengeksekusi jabat tangan token v2 jitu ke open-api.tiktok.com...");
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) UntunginApp/1.0"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    const responseText = await tokenResponse.text();
    console.log("STATUS HTTP TIKTOK V2:", tokenResponse.status);
    console.log("RESPONS MENTAH TIKTOK V2:", responseText);

    if (!tokenResponse.ok) {
      throw new Error(`Koneksi ditolak server TikTok v2 (HTTP ${tokenResponse.status}). Respons: ${responseText || 'Kosong'}`);
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Data bukan JSON valid. Respons teks mentah: ${responseText.substring(0, 300)}`);
    }

    // EVALUASI BUSINESS LOGIC ERROR DARI TIKTOK V2
    if (tokenData.code !== 0 && tokenData.code !== undefined) {
      throw new Error(tokenData.message || `TikTok API Error (Code: ${tokenData.code})`);
    }

    const targetData = tokenData.data || tokenData;
    const accessToken = targetData.access_token;
    const refreshToken = targetData.refresh_token;
    const sellerName = targetData.seller_name || "Toko TikTok Resmi";
    const sellerId = targetData.seller_id;

    if (!accessToken) {
      throw new Error(`Gagal mengekstrak access_token dari payload v2: ${JSON.stringify(tokenData)}`);
    }

    console.log(`[SUKSES] Berhasil mengintegrasikan toko: ${sellerName} (${sellerId})`);

    // ==============================================================================
    // TODO: Jalankan fungsi mutasi database Supabase kamu di sini untuk menyimpan token
    // ==============================================================================

    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/?tab=integrasi&sync=success`);

  } catch (error: any) {
    console.error("Kesalahan Fatal Callback OAuth TikTok:", error);
    return new NextResponse(
      `<html>
        <body style="font-family:sans-serif; padding:40px; line-height:1.6; background-color:#fafafa;">
          <div style="max-width:600px; margin: 40px auto; background:#fff; padding:30px; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.05); border-top: 4px solid #ef4444;">
            <h2 style="color:#ef4444; margin-top:0;">🚨 Integrasi Tertahan (Gagal Tukar Token)</h2>
            <p>Sistem backend gagal menukarkan kode rahasia sementara menjadi token akses permanen.</p>
            <div style="background:#f1f5f9; padding:14px 18px; border-radius:8px; font-family:monospace; font-size:13px; color:#1e293b; overflow-x:auto; margin:16px 0; white-space: pre-wrap;">
              ${error.message}
            </div>
            <hr style="border:0; border-top:1px solid #e2e8f0; margin:20px 0 Papaya;"/>
            <p style="color:#64748b; font-size:14px; margin:0;">Tutup halaman ini, kembali ke dasbor utama <strong>Untungin.ai</strong>, lalu coba klik tombol integrasi sekali lagi.</p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}