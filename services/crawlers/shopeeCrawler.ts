// File: ./services/crawlers/shopeeCrawler.ts
import { scrapeShopee } from '../../workers/shopeeWorker'; // Gunakan scrapeShopee sesuai saran compiler

export class ShopeeCrawler {
  async scan(keyword: string) {
    // Panggil fungsi scrapeShopee yang diekspor oleh worker Anda
    const rows = await scrapeShopee(keyword); 
    
    // Pastikan rows adalah array sebelum melakukan mapping
    if (!Array.isArray(rows)) return [];

    return rows.map((r: any) => ({
      marketplace: 'Shopee',
      keyword,
      product_name: r.product_name,
      sales: r.sales ?? 0,
      price: r.price ?? 0,
      rating: r.rating ?? 0,
      source: 'playwright'
    }));
  }
}