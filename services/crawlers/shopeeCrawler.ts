// Di dalam file ShopeeCrawler Anda:
import { realtimeShopeeWorker } from '../../workers/shopeeWorker';

export class ShopeeCrawler {
  async scan(keyword: string) {
    // Panggil nama fungsi worker yang baru diisi di atas
    const rows = await realtimeShopeeWorker(keyword); 
    
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