import { BaseCrawler } from './baseCrawler';

export class TokopediaCrawler extends BaseCrawler {
  async scan(keyword: string) {
    return [{
      marketplace: 'Tokopedia',
      keyword,
      product_name: `${keyword} - Tokopedia Product`,
      sales: 800,
      price: 99000,
      rating: 4.7,
    }];
  }
}
