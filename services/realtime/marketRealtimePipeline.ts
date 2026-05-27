export type MarketProduct = {
  source: 'shopee'|'tokopedia'|'tiktok';
  product_id: string;
  title: string;
  price: number;
  sold: number;
  rating: number;
  keyword: string;
  shop_name?: string;
  thumbnail?: string;
  created_at?: string;
};

export async function normalizeProducts(products: MarketProduct[]) {
  return products.map((p) => ({
    ...p,
    trend_score: Math.round((p.sold * 0.5) + (p.rating * 20)),
    opportunity_score: Math.round((100000 / Math.max(p.price,1)) + (p.sold * 0.3)),
    movement_score: Math.round((p.sold * p.rating) / 5)
  }));
}
