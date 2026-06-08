import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateParams = searchParams.get("state") || "";

    // 1. Ambil App Key dan Redirect URI aplikasi Untungin.ai milikmu
    // Masukkan App Key dari TikTok Shop Partner Center Console kamu di sini
    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "MASUKKAN_APP_KEY_TIKTOK_KAMU_DISINI";
    
    // Pastikan URL ini sudah kamu daftarkan juga di bagian "Redirect URI" di konsol TikTok Developer
    const REDIRECT_URI = "https://untungin-ai-pmd1.vercel.app/api/auth/tiktok/callback";

    // 2. Bangun URL Oauth Resmi Service Auth TikTok Shop untuk pasar Indonesia (SOP Region)
    // Pengguna SaaS kamu akan diarahkan ke halaman login & klik 'Gunakan Aplikasi ini'
    const tiktokAuthUrl = new URL("https://auth.tiktok-services.com/oauth/authorize");
    
    tiktokAuthUrl.searchParams.append("app_key", TIKTOK_APP_KEY);
    tiktokAuthUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    tiktokAuthUrl.searchParams.append("state", stateParams); 

    console.log("Mengalihkan pengguna SaaS ke gerbang otorisasi TikTok Shop...");

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