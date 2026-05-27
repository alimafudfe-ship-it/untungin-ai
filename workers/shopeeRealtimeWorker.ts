import { normalizeProducts } from '../services/realtime/marketRealtimePipeline';

export async function runShopeeRealtimeWorker(keyword: string) {
  const response = await fetch(`https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${keyword}&limit=20`);
  const data = await response.json();

  const products = (data?.items || []).map((item: any) => ({
    source: 'shopee',
    product_id: item?.item_basic?.itemid?.toString(),
    title: item?.item_basic?.name,
    price: item?.item_basic?.price / 100000,
    sold: item?.item_basic?.historical_sold || 0,
    rating: item?.item_basic?.item_rating?.rating_star || 0,
    keyword,
    shop_name: item?.item_basic?.shop_name,
    thumbnail: item?.item_basic?.image
  }));

  return normalizeProducts(products);
}
