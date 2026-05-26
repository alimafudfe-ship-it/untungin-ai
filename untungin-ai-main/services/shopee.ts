async function fetchWithRetry(url, options, retries = 3) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error("Blocked");
    return res;
  } catch (err) {
    if (retries === 0) throw err;
    return fetchWithRetry(url, options, retries - 1);
  }
}

// /services/shopee.ts
export async function getShopeeProducts() {
  try {
    const url =
      "https://shopee.co.id/api/v4/search/search_items?by=sales&limit=20";

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://shopee.co.id/",
        "Origin": "https://shopee.co.id",
        "Connection": "keep-alive",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.log("Shopee blocked:", res.status);
      return fallbackProducts();
    }

    const data = await res.json();

    if (!data?.items?.length) {
      return fallbackProducts();
    }

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
  } catch (err) {
    console.error("Shopee error:", err);
    return fallbackProducts();
  }
}

function fallbackProducts() {
  return [
    {
      id: "demo1",
      title: "Produk Viral (Fallback)",
      price: 25000,
      sold: 1200,
      rating: 4.8,
      reviews: 320,
      image: "https://via.placeholder.com/300",
      shop: "demo",
      platform: "shopee",
      url: "#",
      created_at: new Date().toISOString(),
    },
  ];
}