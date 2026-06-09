import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateParams = searchParams.get("state") || "";

    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "6k0m8n8r9dh8j";
    // 💡 MASUKKAN SERVICE ID DARI PARTNER CENTER KAMU DI SINI
    const TIKTOK_SERVICE_ID = process.env.TIKTOK_SHOP_SERVICE_ID || "MASUKKAN_SERVICE_ID_KAMU_DISINI"; 
    
    const REDIRECT_URI = "https://untungin-ai-pmd1.vercel.app/api/auth/tiktok/callback";

    // Menggunakan URL OAuth V2 Resmi TikTok Shop
    const tiktokAuthUrl = new URL("https://auth.tiktok-shops.com/oauth/authorize");
    
    tiktokAuthUrl.searchParams.append("app_key", TIKTOK_APP_KEY);
    tiktokAuthUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    tiktokAuthUrl.searchParams.append("state", stateParams); 
    
    // ✨ PERBAIKAN: Wajib sertakan service_id untuk otorisasi multi-toko / service market di Indonesia
    tiktokAuthUrl.searchParams.append("service_id", TIKTOK_SERVICE_ID);

    console.log("Mengalihkan pengguna SaaS ke gerbang otorisasi resmi TikTok Shop V2 dengan Service ID...");

    return NextResponse.redirect(tiktokAuthUrl.toString());

  } catch (error: any) {
    console.error("Gagal membuat sesi OAuth TikTok:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses otorisasi integrasi TikTok Shop" },
      { status: 500 }
    );
  }
}