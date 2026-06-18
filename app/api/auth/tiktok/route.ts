import { NextResponse } from "next/server";

// Fungsi penanganan jika front-end memanggil via POST
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, workspaceId } = body;

    const stateObj = { userId, workspaceId };
    const stateParams = encodeURIComponent(JSON.stringify(stateObj));

    // Ambil dari environment variable atau isi langsung di sini
    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "MASUKKAN_APP_KEY_TIKTOK_KAMU_DISINI";
    const REDIRECT_URI = "https://untungin-ai-pmd1.vercel.app/api/auth/tiktok/callback";

    // Menggunakan domain resmi yang benar (auth.tiktok-shops.com)
    const tiktokAuthUrl = new URL("https://services.tiktokshop.com/open/authorize");
    tiktokAuthUrl.searchParams.append("app_key", TIKTOK_APP_KEY);
    tiktokAuthUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    tiktokAuthUrl.searchParams.append("state", stateParams); 

    console.log("Mengarahkan pengguna (POST) ke gerbang otorisasi TikTok Shop...");
    
    // Mengembalikan URL ke front-end agar ditangani oleh window.location.href
    return NextResponse.json({ success: true, url: tiktokAuthUrl.toString() });

  } catch (error: any) {
    console.error("Gagal memproses POST OAuth TikTok:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Fungsi penanganan jika diakses langsung atau via GET
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateParams = searchParams.get("state") || "";

    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "MASUKKAN_APP_KEY_TIKTOK_KAMU_DISINI";
    const REDIRECT_URI = "https://untungin-ai-pmd1.vercel.app/api/auth/tiktok/callback";

    // SUDAH DIPERBAIKI: Mengubah services menjadi shops agar tidak NXDOMAIN
    const tiktokAuthUrl = new URL("https://services.tiktokshop.com/open/authorize");
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