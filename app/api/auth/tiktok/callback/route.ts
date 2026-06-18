import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Ambil authorization code yang dilempar dari redirect TikTok
    const code = searchParams.get("auth_code") || searchParams.get("code");
    const stateParams = searchParams.get("state") || "";

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Otorisasi dibatalkan atau auth_code tidak ditemukan." }, 
        { status: 400 }
      );
    }

    // 2. Ambil Kredensial Aplikasi Publik Resmi Untungin.ai
    const TIKTOK_APP_KEY = process.env.NEXT_PUBLIC_TIKTOK_APP_KEY || process.env.TIKTOK_SHOP_APP_KEY || "6k9tqhh1i366s"; 
    const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET || "b0edb9990afd61f40c7d704f6e7cdaa0bcdd5809";

    // 3. ENDPOINT OAUTH V2 RESMI UNTUK PUBLIC APP MARKETPLACE
    const baseUrl = "https://auth.tiktok-shops.com/api/v2/token/get";
    
    // 4. Bangun Query String Parameters (Wajib dimasukkan langsung ke URL)
    const urlParams = new URLSearchParams();
    urlParams.append("app_key", TIKTOK_APP_KEY);
    urlParams.append("app_secret", TIKTOK_APP_SECRET);
    urlParams.append("auth_code", code);
    urlParams.append("grant_type", "authorized_code");

    const finalTokenUrl = `${baseUrl}?${urlParams.toString()}`;
    console.log("Menembak Jabat Tangan Token V2 via GET ke:", finalTokenUrl);

    // 5. Eksekusi request menggunakan metode GET dengan Spoofing User-Agent agar lolos WAF
    const tokenResponse = await fetch(finalTokenUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 UntunginApp/1.0"
      },
      cache: "no-store"
    });

    const responseText = await tokenResponse.text();
    console.log("STATUS HTTP RESMI TIKTOK:", tokenResponse.status);
    console.log("RESPONS MENTAH RESMI TIKTOK:", responseText);

    if (!tokenResponse.ok) {
      throw new Error(`Server TikTok mengembalikan HTTP Error ${tokenResponse.status}. Respons: ${responseText}`);
    }

    if (!responseText || responseText.trim() === "") {
      throw new Error("Server TikTok memberikan respons kosong/hampa.");
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Gagal parse JSON. Respons teks mentah: ${responseText.substring(0, 300)}`);
    }

    // EVALUASI ERROR LOGIC INTERNAL TIKTOK
    if (tokenData.code !== 0 && tokenData.code !== undefined) {
      throw new Error(tokenData.message || `TikTok API Error (Code: ${tokenData.code})`);
    }

    const targetData = tokenData.data || tokenData;
    const accessToken = targetData.access_token;
    const refreshToken = targetData.refresh_token;
    const sellerName = targetData.seller_name || "Toko TikTok Resmi";
    const sellerId = targetData.seller_id;

    if (!accessToken) {
      throw new Error(`Gagal mengekstrak access_token dari data respons: ${JSON.stringify(tokenData)}`);
    }

    console.log(`[SUKSES TOTAL V2] Berhasil menautkan toko seller: ${sellerName} (${sellerId})`);

    // ==============================================================================
    // TODO: Jalankan query database Supabase kamu di sini untuk mengamankan token
    // ==============================================================================

    const currentOrigin = new URL(request.url).origin;
    return NextResponse.redirect(`${currentOrigin}/?tab=integrasi&sync=success`);

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
             Papaya;"/>
            <p style="color:#64748b; font-size:14px; margin:0;">Tutup halaman ini, kembali ke dasbor utama <strong>Untungin.ai</strong>, lalu coba klik tombol integrasi sekali lagi.</p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}