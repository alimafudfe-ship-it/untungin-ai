// File: ./app/api/market-intelligence/bundle/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");

    if (!keyword) {
      return NextResponse.json({ ok: false, error: "Kata kunci pencarian wajib diisi." }, { status: 200 });
    }

    console.log(`[Market Intel] Mencari data kompetitor untuk kata kunci: ${keyword}`);

    // TIPS AMAN: Menggunakan User-Agent tiruan agar tidak mudah diblokir 403 oleh Shopee/TikTok
    const targetUrl = `https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(keyword)}&limit=20&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=5`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Referer": "https://shopee.co.id/"
      }
    });

    // Jika diblokir oleh anti-bot marketplace (Eror 403)
    if (response.status === 403) {
      console.warn("⚠️ IP Terdeteksi Bot oleh Shopee (403). Mengembalikan data fallback simulasi.");
      
      // Ambil data mockup/fallback agar UI dashboard tidak macet "Sedang memproses"
      const fallbackProducts = getFallbackIntelData(keyword);
      return NextResponse.json({
        ok: true,
        message: "Menampilkan data analisis pasar (Simulasi Fallback karena batasan rate-limit IP).",
        products: fallbackProducts
      });
    }

    const data = await response.json();
    
    // Format data dari marketplace ke struktur internal Untungin.ai Anda
    const formattedProducts = (data.item_basic || []).map((item: any) => ({
      id: item.itemid,
      name: item.name,
      price: item.price / 100000, // Penyesuaian format mata uang Shopee
      historical_sold: item.historical_sold,
      image: item.image,
      rating: item.item_rating?.rating_star || 0
    }));

    return NextResponse.json({
      ok: true,
      products: formattedProducts
    });

  } catch (error: any) {
    console.error("[Intel Error]:", error);
    return NextResponse.json({ ok: false, error: `Mesin crawler gagal: ${error.message}` }, { status: 200 });
  }
}

// Fungsi pembantu untuk menyediakan data simulasi jika IP internet Anda sedang diblokir Shopee
function getFallbackIntelData(keyword: string) {
  return [
    { id: "101", name: `${keyword} Casual Pria Trendy Distro`, price: 149000, historical_sold: 1250, rating: 4.8 },
    { id: "102", name: `${keyword} Sneakers Olahraga Running Premium`, price: 285000, historical_sold: 840, rating: 4.7 },
    { id: "103", name: `${keyword} Kanvas Slip On Kasual Wanita`, price: 99000, historical_sold: 2300, rating: 4.6 },
  ];
}