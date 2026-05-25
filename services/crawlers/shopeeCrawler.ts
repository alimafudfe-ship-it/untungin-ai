import { BaseCrawler } from './baseCrawler';

export class ShopeeCrawler extends BaseCrawler {
  async scan(keyword: string) {
    return [{
      marketplace: 'Shopee',
      keyword,
      product_name: 'Sample Shopee Product',
      sales: 1200,
      price: 45000,
      rating: 4.8,
    }];
  }
}
