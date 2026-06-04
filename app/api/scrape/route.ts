import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;

    if (!keyword) {
      return NextResponse.json({ ok: false, error: "Keyword wajib diisi" }, { status: 200 });
    }

    console.log(`[Scraper] Memproses pencarian intel untuk keyword: ${keyword}`);

    // URL Pencarian Produk Shopee V4
    const shopeeUrl = `https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(keyword)}&limit=10&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=5`;

    // 🌟 TRIK UTAMA: Menyamar sebagai Browser Populer (User-Agent Spofing)
    const response = await fetch(shopeeUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://shopee.co.id/",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    // 🛡️ ANTISIPASI EROR 403: Jika sistem keamanan Shopee masih memblokir IP lokal Anda
    if (response.status === 403) {
      console.warn("⚠️ IP Terblokir Shopee (403). Mengembalikan data simulasi cerdas.");
      
      // Mengembalikan data mockup yang dinamis berdasarkan keyword agar UI frontend Anda tetap tampil cantik
      const mockProducts = generateMockIntelData(keyword);
      return NextResponse.json({
        ok: true,
        isMocked: true,
        message: "Menampilkan analisis tren pasar (Simulasi karena batasan IP pembatasan akses).",
        products: mockProducts
      });
    }

    const data = await response.json();
    const items = data.items || [];

    // Format data asli dari Shopee ke struktur data Untungin.ai Anda
    const formattedProducts = items.map((wrapper: any) => {
      const item = wrapper.item_basic;
      if (!item) return null;
      return {
        id: item.itemid?.toString(),
        name: item.name,
        price: item.price / 100000, // Konversi format nominal internal Shopee ke Rupiah asli
        historical_sold: item.historical_sold || 0,
        rating: item.item_rating?.rating_star || 0,
        image: item.image ? `https://down-id.img.sspace.lookaside.fbsbx.com/file/${item.image}` : null
      };
    }).filter(Boolean);

    return NextResponse.json({
      ok: true,
      products: formattedProducts
    });

  } catch (error: any) {
    console.error("❌ Scraper Error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: "Gagal memproses data marketplace", 
      details: error.message,
      products: [] 
    }, { status: 200 });
  }
}

// 💡 Fungsi Generator Data Cadangan (Mencegah Dashboard Macet/Kosong saat Offline/Terblokir)
function generateMockIntelData(keyword: string) {
  return [
    {
      id: "mock-1",
      name: `${keyword.toUpperCase()} Casual Sneakers Pria Distro Original`,
      price: 189000,
      historical_sold: 4520,
      rating: 4.8
    },
    {
      id: "mock-2",
      name: `${keyword.toUpperCase()} Wanita Running Sport Aero`,
      price: 245000,
      historical_sold: 2110,
      rating: 4.7
    },
    {
      id: "mock-3",
      name: `${keyword.toUpperCase()} Boot Kulit Sapi Asli Pekerja Pro`,
      price: 399000,
      historical_sold: 840,
      rating: 4.9
    }
  ];
}