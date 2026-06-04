// File: ./services/crawlers/shopeeCrawler.ts

export class ShopeeCrawler {
  async scan(keyword: string): Promise<any[]> {
    // 1. Validasi input keyword
    if (!keyword || keyword.trim() === '') {
      console.error("[ShopeeCrawler] Keyword pencarian kosong.");
      throw new Error("Kata kunci pencarian tidak boleh kosong.");
    }

    console.log(`[Heuristik Lokal] Menarik data pasar murni Shopee secara mandiri untuk: "${keyword}"`);

    try {
      // 2. Gunakan endpoint API internal Mobile Shopee (Gratis & Bypass Cloudflare Web)
      const url = `https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(keyword)}&limit=20&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;

      // 3. Set header menyamar sebagai Android Native / Mobile Browser
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          "Accept": "application/json",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Referer": `https://shopee.co.id/search?keyword=${encodeURIComponent(keyword)}`,
          "X-Requested-With": "XMLHttpRequest",
          "X-API-SOURCE": "pc"
        }
      });

      if (!response.ok) {
        throw new Error(`Shopee API menolak request (Status HTTP: ${response.status}). Kemungkinan IP Anda terblokir sementara.`);
      }

      const data = await response.json();
      
      // 4. Validasi struktur respon JSON internal Shopee
      if (!data || !data.item_basic_list) {
        throw new Error("Gagal mendapatkan struktur data valid. Shopee mendeteksi aktivitas bot atau sedang maintenance.");
      }

      const products = data.item_basic_list;
      const liveItems: any[] = [];

      // 5. Loop dan petakan data mentah Shopee ke format Untungin.ai
      for (const prod of products) {
        const item = prod.item_basic;
        if (!item) continue;

        // API Internal Shopee mengembalikan harga dikali 100.000 (Format Sen), kita normalkan ke Rupiah
        const realPrice = Number(item.price || 0) / 100000;
        const realPriceMax = Number(item.price_max || item.price || 0) / 100000;

        // Hitung total penjualan riil
        const totalSales = Number(item.historical_sold || item.sold || 0);

        liveItems.push({
          id: item.itemid ? `shopee-${item.itemid}` : `live-${Math.random()}`,
          product_name: item.name || "Produk Shopee", // Judul asli seller
          price: realPrice, 
          price_max: realPriceMax,
          sales: totalSales, 
          rating: Number(item.item_rating?.rating_star || 5),
          reviews: Number(item.item_rating?.rating_count?.[0] || 0), // Mengambil jumlah total rating
          shop_name: item.shop_name || "Merchant Shopee", // Di API internal terkadang butuh fetch terpisah, kita beri fallback aman
          shop_location: item.shop_location || "Indonesia", 
          
          // Metrik Heuristik bawaan Untungin.ai Anda tetap terjaga
          demand_score: Math.min(100, Math.max(40, Math.floor(totalSales / 35))),
          growth_score: Math.floor(Math.random() * 20) + 75,
          competition_score: Math.floor(Math.random() * 30) + 45,
          saturation_score: Math.floor(Math.random() * 25) + 35,
          margin_signal: Math.floor(Math.random() * 15) + 80
        });
      }

      if (liveItems.length === 0) {
        throw new Error("Tidak ada produk murni yang ditemukan di Shopee untuk kata kunci ini.");
      }

      console.log(`[Heuristik Lokal] Sukses memproses ${liveItems.length} produk langsung dari Shopee.`);
      return liveItems;

    } catch (error: any) {
      console.error("[ShopeeCrawler Fatal Error]:", error.message);
      // Tetap lempar error agar route.ts menangkapnya dan mengirimkan respon elegan ke frontend Anda
      throw error; 
    }
  }
}