import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // TikTok akan mengirimkan 'code' rahasia ke URL ini
    const code = searchParams.get("code");
    const stateParams = searchParams.get("state") || "";

    if (!code) {
      return NextResponse.json({ success: false, error: "Otorisasi dibatalkan atau kode tidak ditemukan." }, { status: 400 });
    }

    // Ekstrak kembali userId dan workspaceId dari state yang dikirim front-end sebelumnya
    let userId = null;
    let workspaceId = null;
    try {
      const parsedState = JSON.parse(decodeURIComponent(stateParams));
      userId = parsedState.userId;
      workspaceId = parsedState.workspaceId;
    } catch (e) {
      console.error("Gagal membaca data state parameter:", e);
    }

    console.log(`Menerima auth code dari TikTok. Menukarkan token untuk Workspace: ${workspaceId}`);

    // Kredensial App kamu dari TikTok Partner Center Console
    const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "MASUKKAN_APP_KEY_TIKTOK_KAMU_DISINI";
    const TIKTOK_APP_SECRET = process.env.TIKTOK_SHOP_APP_SECRET || "MASUKKAN_APP_SECRET_TIKTOK_KAMU_DISINI";

    // 1. HIT KE SERVER TIKTOK: Tukar Authorization Code menjadi Access Token Resmi Toko Pembeli
    const tokenUrl = `https://auth.tiktok-services.com/api/v2/token/get?app_key=${TIKTOK_APP_KEY}&app_secret=${TIKTOK_APP_SECRET}&auth_code=${code}&grant_type=authorized_code`;
    
    const tokenResponse = await fetch(tokenUrl, { method: "GET" });
    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.data?.access_token) {
      throw new Error(tokenData.message || "Gagal mendapatkan Access Token dari TikTok Shop.");
    }

    const accessToken = tokenData.data.access_token;
    const refreshToken = tokenData.data.refresh_token;
    const sellerName = tokenData.data.seller_name || "Toko TikTok Resmi";
    const openId = tokenData.data.open_id; // ID unik toko di TikTok

    // 2. SIMPAN KE SUPABASE (Logika Database Anda)
    // Di sini kamu tinggal panggil query Supabase untuk menyimpan accessToken, openId, dan sellerName
    // ke dalam tabel 'marketplace_connections' atau 'stores' milik user yang bersangkutan.
    //
    // example: await supabase.from('stores').insert({ workspace_id: workspaceId, platform: 'TikTok', token: accessToken, name: sellerName })

    console.log(`Sukses mengintegrasikan Toko Resmi: ${sellerName}`);

    // 3. SETELAH SUKSES: Lempar balik halaman browser pembeli ke dashboard utama app Vercel kamu
    // Kita arahkan kembali ke menu Integrasi agar tabel langsung mendeteksi status "Terhubung"
    return NextResponse.redirect(new URL("/?tab=integrasi&sync=success", request.url));

  } catch (error: any) {
    console.error("Error pada Callback OAuth TikTok:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses pertukaran token TikTok Shop" },
      { status: 500 }
    );
  }
}