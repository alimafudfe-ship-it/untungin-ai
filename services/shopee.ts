export async function getShopeeProducts() {
  try {
    const res = await fetch(
      "https://shopee.co.id/api/v4/search/search_items?by=sales&limit=20",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Referer": "https://shopee.co.id/",
        },
      }
    );

    const data = await res.json();

    if (!data.items) return [];

    return data.items.map((item) => ({
      id: item.itemid,
      title: item.name,
      price: item.price / 100000,
      sold: item.historical_sold,
      rating: item.item_rating?.rating_star || 0,
      reviews: item.item_rating?.rating_count?.[0] || 0,
      image: `https://cf.shopee.co.id/file/${item.image}`,
      shop: item.shopid,
      platform: "shopee",
      url: `https://shopee.co.id/product/${item.shopid}/${item.itemid}`,
      created_at: new Date().toISOString(),
    }));
  } catch (e) {
    console.error("Shopee fetch error:", e);
    return [];
  }
}