// /services/shopee.ts

export async function getShopeeProducts() {
  try {
    const url =
      "https://shopee.co.id/api/v4/search/search_items?by=sales&limit=20";

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    // JANGAN fallback ke produk demo
    if (!res.ok) {
      console.log("Shopee blocked:", res.status);
      return [];
    }

    const data = await res.json();

    if (!data?.items?.length) {
      return [];
    }

    return data.items.map((item) => ({
      id: item.itemid,
      title: item.name,
      price: item.price / 100000,
      sold: item.historical_sold || 0,
      rating: item.item_rating?.rating_star || 0,
      reviews: item.item_rating?.rating_count?.[0] || 0,
      image: `https://cf.shopee.co.id/file/${item.image}`,
      shop: item.shopid,
      platform: "shopee",
      url: `https://shopee.co.id/product/${item.shopid}/${item.itemid}`,
      created_at: new Date().toISOString(),
    }));
  } catch (err) {
    console.error("Shopee error:", err);

    // kosong → supaya route fallback ke Supabase
    return [];
  }
}