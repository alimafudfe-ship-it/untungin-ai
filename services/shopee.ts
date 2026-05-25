
export async function getShopeeProducts() {
  try {
    const res = await fetch("https://shopee.co.id/api/v4/search/search_items?by=sales");
    const data = await res.json();

    return data.items.map((item) => ({
      id: item.itemid,
      title: item.name,
      price: item.price / 100000,
      sold: item.historical_sold,
      rating: item.item_rating.rating_star,
      reviews: item.item_rating.rating_count[0],
      image: `https://cf.shopee.co.id/file/${item.image}`,
      shop: item.shopid,
      platform: "shopee",
      url: `https://shopee.co.id/product/${item.shopid}/${item.itemid}`,
      created_at: new Date().toISOString()
    }));
  } catch (e) {
    return [];
  }
}
