import { scrapeShopee } from '../../workers/shopeeWorker';

export class ShopeeCrawler {
  async scan(keyword: string) {
    const rows = await scrapeShopee(keyword);
    return rows.map((r:any)=>({
      marketplace:'Shopee',
      keyword,
      product_name:r.product_name,
      sales:r.sales ?? 0,
      price:r.price ?? 0,
      rating:r.rating ?? 0,
      source:'playwright'
    }));
  }
}
