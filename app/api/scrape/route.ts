import { NextResponse } from "next/server";
import { ShopeeCrawler } from "@/services/crawlers/shopeeCrawler";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim();

  if (!keyword) {
    return NextResponse.json({ error: "Kata kunci harus diisi" }, { status: 400 });
  }

  try {
    console.log(`[API Scrape] Menjalankan crawler live untuk keyword: ${keyword}`);
    
    // 1. Panggil ShopeeCrawler asli yang terhubung ke Playwright Worker
    const shopeeInstance = new ShopeeCrawler();
    const liveData = await shopeeInstance.scan(keyword);

    // 2. PROTEKSI FALLBACK: Jika liveData kosong (karena diblokir anti-bot/timeout)
    if (!liveData || liveData.length === 0) {
      console.warn(`[API Scrape] Live scraping kosong/diblokir. Mengaktifkan data simulasi dinamis untuk: ${keyword}`);
      
      // Membuat angka pengacak (seed) unik berdasarkan karakter kata kunci
      const seed = keyword.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      
      const mockShops = [
        { name: "IndoFashion Official", city: "Jakarta Barat" },
        { name: "GrosirFashion.id", city: "Bandung" },
        { name: "StyleMaster Store", city: "Surabaya" },
        { name: "KidzWear Supply", city: "Solo" },
        { name: "BigSize-Corner", city: "Semarang" }
      ];

      const fallbackProducts = Array.from({ length: 5 }).map((_, i) => {
        // Rumus matematika berbasis seed agar angka baju, kemeja, dan sepatu PASTI berbeda jauh
        const baseSales = ((seed * (i + 4)) % 3500) + 150;
        const basePrice = ((seed * (i + 7)) % 400000) + 45000;
        
        const price = Math.round(basePrice / 1000) * 1000; // Bulatkan ke ribuan Rupiah
        const monthlySales = Math.round(baseSales);
        const shop = mockShops[(seed + i) % mockShops.length]; // Toko diacak urutannya

        let nameTemplate = `${capitalizedKeyword} Premium Distro Original Quality`;
        if (i === 1) nameTemplate = `${capitalizedKeyword} Casual Trendy Terlaris Murah`;
        if (i === 2) nameTemplate = `${capitalizedKeyword} Exclusive Edition Import BM`;
        if (i === 3) nameTemplate = `${capitalizedKeyword} Anak & Remaja Motif Kekinian`;
        if (i === 4) nameTemplate = `${capitalizedKeyword} Jumbo Big Size Oversize Unisex`;

        return {
          id: i + 1,
          name: nameTemplate,
          price: price,
          monthlySales: monthlySales,
          revenue: price * monthlySales,
          shop: shop.name,
          location: shop.city
        };
      });

      return NextResponse.json({ products: fallbackProducts, source: "simulation_mode" });
    }

    // 3. JIKA REAL LIVE DATA TEMBUS: Format data dari Playwright agar cocok dengan tabel frontend Anda
    const formattedProducts = liveData.map((item: any, i: number) => {
      const price = item.price || 0;
      const sales = item.sales || 0;
      
      return {
        id: i + 1,
        name: item.product_name,
        price: price,
        monthlySales: sales,
        revenue: price * sales,
        shop: item.shop_name || "Shopee Seller Store",
        location: item.shop_location || "Indonesia"
      };
    });

    return NextResponse.json({ products: formattedProducts, source: "pure_live_playwright" });

  } catch (error: any) {
    console.error("Scrape Error:", error);
    return NextResponse.json({ error: "Gagal memata-matai pasar", details: error.message }, { status: 500 });
  }
}