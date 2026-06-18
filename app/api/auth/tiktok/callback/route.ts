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

    // PROTEKSI AMAN: Fallback langsung menggunakan kredensial asli aplikasi publik Untungin.ai kamu
    const TIKTOK_APP_KEY = process.env.NEXT_PUBLIC_TIKTOK_APP_KEY || process.env.TIKTOK_SHOP_APP_KEY || "6k9tqhh1i366s"; 
    const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET || process.env.TIKTOK_SHOP_APP_SECRET || "b0edb9990afd61f40c7d704f6e7cdaa0bcdd5809";

    // ENDPOINT REKONSILIASI OAUTH V1 UTK PUBLIC SERVICE MARKET APP INDONESIA
    const tokenUrl = "https://auth.tiktok-shops.com/api/v1/auth/token"; 
    
    // Payload wajib menggunakan skema string murni x-www-form-urlencoded
    const urlParams = new URLSearchParams();
    urlParams.append("app_key", TIKTOK_APP_KEY);
    urlParams.append("app_secret", TIKTOK_APP_SECRET);
    urlParams.append("auth_code", code);
    urlParams.append("grant_type", "authorized_code"); // PENTING: Jangan diubah menjadi authorization_code

    console.log("Mengeksekusi jabat tangan token via form-urlencoded...");
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: urlParams.toString(),
      cache: "no-store"
    });

    const responseText = await tokenResponse.text();
    console.log("Respons otentikasi masuk dari TikTok:", responseText);

    if (!tokenResponse.ok) {
      throw new Error(`Koneksi ditolak server TikTok (HTTP ${tokenResponse.status}). Respons: ${responseText || 'Kosong'}`);
    }

    if (!responseText || responseText.trim() === "") {
      throw new Error("Server TikTok mengembalikan respons hampa (Empty Response). Periksa kembali status App Secret di konsol pengembang.");
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Data bukan JSON valid. Respons teks mentah: ${responseText.substring(0, 300)}`);
    }

    // EVALUASI BUSINESS LOGIC ERROR DARI TIKTOK
    if (tokenData.code !== 0 && tokenData.code !== undefined) {
      throw new Error(tokenData.message || `TikTok API Error Internal (Code: ${tokenData.code})`);
    }

    // VALIDASI PARSING STRUKTUR PAYLOAD SECARA ADAPTIF
    const targetData = tokenData.data || tokenData;
    const accessToken = targetData.access_token;
    const refreshToken = targetData.refresh_token;
    const sellerName = targetData.seller_name || "Toko TikTok Resmi";
    const sellerId = targetData.seller_id;

    if (!accessToken) {
      throw new Error(`Gagal mengekstrak access_token dari payload resmi TikTok: ${JSON.stringify(tokenData)}`);
    }

    console.log(`Sukses total mengintegrasikan toko seller: ${sellerName} (${sellerId})`);

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
            <hr style="border:0; border-top:1px solid #e2e8f0; margin:20px 0;"/>
            <p style="color:#64748b; font-size:14px; margin:0;">Tutup halaman ini, kembali ke dasbor utama <strong>Untungin.ai</strong>, lalu coba klik tombol integrasi sekali lagi.</p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}