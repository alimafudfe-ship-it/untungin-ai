import { NextResponse } from "next/server";

// Fungsi penanganan jika front-end memanggil via POST
export async function POST(request: Request) {
  try {
    // Karena dipanggil lewat POST, kita ambil state dari body JSON
    const body = await request.json().catch(() => ({}));
    const { userId, workspaceId } = body;

    const stateObj = { userId, workspaceId };
    const stateParams = encodeURIComponent(JSON.stringify(stateObj));

    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "MASUKKAN_APP_KEY_TIKTOK_KAMU_DISINI";
    const REDIRECT_URI = "https://untungin-ai-pmd1.vercel.app/api/auth/tiktok/callback";

    const tiktokAuthUrl = new URL("https://auth.tiktok-shops.com/oauth/authorize");
    tiktokAuthUrl.searchParams.append("app_key", TIKTOK_APP_KEY);
    tiktokAuthUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    tiktokAuthUrl.searchParams.append("state", stateParams); 

    console.log("Mengarahkan pengguna (POST) ke gerbang otorisasi TikTok Shop...");
    
    // Kirim URL balik agar front-end bisa melakukan window.location.href secara aman
    return NextResponse.json({ success: true, url: tiktokAuthUrl.toString() });

  } catch (error: any) {
    console.error("Gagal memproses POST OAuth TikTok:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Tetap sediakan fungsi GET sebagai cadangan (jika diakses via URL browser langsung)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateParams = searchParams.get("state") || "";

    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "MASUKKAN_APP_KEY_TIKTOK_KAMU_DISINI";
    const REDIRECT_URI = "https://untungin-ai-pmd1.vercel.app/api/auth/tiktok/callback";

    const tiktokAuthUrl = new URL("https://auth.tiktok-services.com/oauth/authorize");
    tiktokAuthUrl.searchParams.append("app_key", TIKTOK_APP_KEY);
    tiktokAuthUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    tiktokAuthUrl.searchParams.append("state", stateParams); 

    console.log("Mengarahkan pengguna (GET) ke gerbang otorisasi TikTok Shop...");
    return NextResponse.redirect(tiktokAuthUrl.toString());

  } catch (error: any) {
    console.error("Gagal memproses GET OAuth TikTok:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}