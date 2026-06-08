import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { platform, workspaceId } = body;

    if (platform?.toLowerCase() === "tiktok") {
      
      // 1. Ambil Kredensial Utama Untungin.ai
      const TIKTOK_APP_KEY = process.env.TIKTOK_SHOP_APP_KEY || "MASUKKAN_APP_KEY_TIKTOK_KAMU_DISINI";
      const TIKTOK_APP_SECRET = process.env.TIKTOK_SHOP_APP_SECRET || "MASUKKAN_APP_SECRET_TIKTOK_KAMU_DISINI";

      // 2. LOGIKA DATABASE: Ambil AccessToken toko milik workspace ini yang tadi disimpan saat callback
      // (Contoh jika menggunakan token dinamis dari DB, atau untuk tes cepat masukkan token toko ujicoba kamu di sini)
      const ACCESS_TOKEN = process.env.TIKTOK_SHOP_ACCESS_TOKEN || "MASUKKAN_ACCESS_TOKEN_TOKO_YANG_TERHUBUNG";

      // 3. Panggil Endpoint Katalog Produk Resmi TikTok Shop API V2
      // Menggunakan method POST sesuai dokumentasi pengembang TikTok Shop
      const tiktokProductUrl = `https://open-api.tiktok-shops.com/api/products/search?app_key=${TIKTOK_APP_KEY}&access_token=${ACCESS_TOKEN}&version=202309`;
      
      const response = await fetch(tiktokProductUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size: 20,
          search_status: 4 // Status 4 biasanya berarti produk AKTIF/LIVE di toko
        })
      });

      const resData = await response.json();

      if (resData.code !== 0) {
        throw new Error(resData.message || "Gagal mengambil data produk dari katalog API TikTok.");
      }

      // 4. Petakan data produk asli dari toko TikTok ke dalam tabel Untungin.ai
      const liveProducts = (resData.data?.products || []).map((item: any) => {
        // Ambil harga dari variasi pertama produk
        const firstSkus = item.skus?.[0] || {};
        return {
          id: item.id,
          name: item.title, // Nama produk asli yang dipajang di TikTok Shop
          sellingPrice: parseFloat(firstSkus.price?.sale_price || firstSkus.price?.original_price || "0"),
          stockRemaining: firstSkus.stock?.available_stock || 0, // Sisa stok riil di gudang TikTok
          quantitySold: item.sales_regions_infos?.[0]?.sales || 0, // Total produk laku
          marketplace: "TikTok"
        };
      });

      return NextResponse.json({
        success: true,
        message: "Berhasil menarik data katalog live dari toko TikTok Shop resmi!",
        products: liveProducts
      });
    }

    return NextResponse.json({ success: true, products: [] });

  } catch (error: any) {
    console.error("Gagal melakukan sinkronisasi produk live:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghubungi server API TikTok" },
      { status: 500 }
    );
  }
}