import { BaseCrawler } from './baseCrawler';

export class LazadaCrawler extends BaseCrawler {
  async scan(keyword: string) {
    return [{
      marketplace: 'Lazada',
      keyword,
      product_name: 'Sample Lazada Product',
      sales: 650,
      price: 79000,
      rating: 4.6,
    }];
  }
}
