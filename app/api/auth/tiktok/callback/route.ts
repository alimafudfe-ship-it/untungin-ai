import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("auth_code") || searchParams.get("code");
    
    // Ambil app_key secara dinamis dari URL yang dilempar TikTok
    const TIKTOK_APP_KEY = searchParams.get("app_key") || process.env.NEXT_PUBLIC_TIKTOK_APP_KEY || "6k9tqhh1i366s"; 
    const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET || "b0edb9990afd61f40c7d704f6e7cdaa0bcdd5809";

    if (!code) {
      return NextResponse.json({ success: false, error: "Auth code tidak ditemukan." }, { status: 400 });
    }

    // Endpoint Resmi Penukaran Token API v2 untuk Aplikasi Publik di Marketplace
    const tokenUrl = "https://api.tiktokshop.com/api/v2/token/get"; 
    
    // Payload wajib berbentuk objek JSON murni (Standard v2)
    const payload = {
      app_key: TIKTOK_APP_KEY,
      app_secret: TIKTOK_APP_SECRET,
      auth_code: code,
      grant_type: "authorized_code"
    };

    console.log("Menjalankan Tukar Token Aplikasi Public v2 ke:", tokenUrl);
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    const responseText = await tokenResponse.text();
    console.log("Respons Mentah TikTok v2:", responseText);

    if (!tokenResponse.ok) {
      throw new Error(`Server TikTok Menolak (HTTP ${tokenResponse.status}). Respons: ${responseText}`);
    }

    const tokenData = JSON.parse(responseText);

    if (tokenData.code !== 0 && tokenData.code !== undefined) {
      throw new Error(tokenData.message || `API Error Code: ${tokenData.code}`);
    }

    const targetData = tokenData.data || tokenData;
    const accessToken = targetData.access_token;
    const sellerName = targetData.seller_name || "Toko TikTok Resmi";

    console.log(`🚀 INTEGRASI SUKSES TOTAL! Toko: ${sellerName}`);

    // ==============================================================================
    // TODO: Simpan accessToken & refresh_token ke database Supabase kamu di sini
    // ==============================================================================

    const baseUrl = new URL(request.url).origin;
    return NextResponse.redirect(`${baseUrl}/?tab=integrasi&sync=success`);

  } catch (error: any) {
    console.error("Kesalahan Fatal Callback:", error);
    return new NextResponse(
      `<html>
        <body style="font-family:sans-serif; padding:40px; background-color:#fafafa;">
          <div style="max-width:600px; margin: 40px auto; background:#fff; padding:30px; border-radius:12px; border-top: 4px solid #ef4444; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <h2 style="color:#ef4444; margin-top:0;">🚨 Gagal Sinkronisasi Aplikasi Public</h2>
            <p>Terjadi kendala saat mencocokkan token dengan sistem TikTok:</p>
            <div style="background:#f1f5f9; padding:14px; border-radius:8px; font-family:monospace; font-size:13px; color:#1e293b; white-space: pre-wrap;">
              ${error.message}
            </div>
            <p style="color:#64748b; font-size:14px; margin-top:20px;">Pastikan kamu mengklik tombol integrasi yang mengarah ke aplikasi tipe <strong>Public (v2)</strong>.</p>
          </div>
        </body>
      </html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}