import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateParams = searchParams.get("state") || "";

    // 1. Ambil App Key resmi kamu (Cocok dengan dashboard image_2a83b6.png)
    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "6k0m8n8r9dh8j";
    
    // Pastikan URL ini sudah 100% sama dengan di Partner Center kamu
    const REDIRECT_URI = "https://untungin-ai-pmd1.vercel.app/api/auth/tiktok/callback";

    // 2. PERBAIKAN UTAMA: Menggunakan URL Oauth V2 Resmi TikTok Shop (tiktok-shops, bukan tiktok-services)
    const tiktokAuthUrl = new URL("https://auth.tiktok-shops.com/oauth/authorize");
    
    tiktokAuthUrl.searchParams.append("app_key", TIKTOK_APP_KEY);
    tiktokAuthUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    tiktokAuthUrl.searchParams.append("state", stateParams); 

    console.log("Mengalihkan pengguna SaaS ke gerbang otorisasi resmi TikTok Shop V2...");

    // 3. Alihkan halaman browser ke gerbang login TikTok resmi
    return NextResponse.redirect(tiktokAuthUrl.toString());

  } catch (error: any) {
    console.error("Gagal membuat sesi OAuth TikTok:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses otorisasi integrasi TikTok Shop" },
      { status: 500 }
    );
  }
}