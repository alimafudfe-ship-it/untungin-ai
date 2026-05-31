// File: ./services/crawlers/shopeeCrawler.ts
import { BaseCrawler } from './baseCrawler';
import { scrapeShopee } from '../../workers/shopeeWorker'; 

export class ShopeeCrawler extends BaseCrawler {
  async scan(keyword: string) {
    console.log(`[Shopee Scraper] Memicu worker Shopee untuk: ${keyword}`);
    
    try {
      // Batasi waktu tunggu maksimal eksekusi worker eksternal selama 10 detik
      const rows = await Promise.race([
        scrapeShopee(keyword),
        new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
      ]);
      
      if (!Array.isArray(rows)) return [];

      return rows.map((r: any) => ({
        marketplace: 'Shopee',
        keyword,
        product_name: r.product_name || 'Produit Shopee',
        sales: r.sales ?? 0,
        price: r.price ?? 0,
        rating: r.rating ?? 0,
        source: 'playwright'
      }));
    } catch (e) {
      console.warn("[Shopee Scraper] Worker lambat atau error, dilewati demi kecepatan backend.");
      return []; // Kembalikan array kosong agar sistem beralih ke Smart Fallback
    }
  }
}