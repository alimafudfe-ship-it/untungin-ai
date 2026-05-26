// app/api/live/route.ts

let cache: any = null;
let lastFetch = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("q") || "sepatu";

    // ⏱ CACHE (1 menit)
    if (cache && Date.now() - lastFetch < 60000) {
      return Response.json({
        success: true,
        source: "cache",
        data: cache
      });
    }

    // ⏱ TIMEOUT CONTROLLER
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const url = `https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(
      keyword
    )}&limit=20&newest=0`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "application/json",
        "Referer": "https://shopee.co.id/",
        "X-Requested-With": "XMLHttpRequest"
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error("Shopee response not OK");
    }

    const json = await res.json();

    const items =
      json?.items?.map((item: any) => ({
        name: item.item_basic?.name,
        price: item.item_basic?.price / 100000,
        sold: item.item_basic?.historical_sold,
        rating: item.item_basic?.item_rating?.rating_star,
        shop: item.item_basic?.shopid
      })) || [];

    // 💾 SIMPAN CACHE
    cache = items;
    lastFetch = Date.now();

    return Response.json({
      success: true,
      source: "live",
      total: items.length,
      data: items
    });
  } catch (err: any) {
    console.error("API LIVE ERROR:", err.message);

    // 🔥 FALLBACK (tidak boleh kosong total)
    return Response.json({
      success: false,
      source: "fallback",
      error: err.message,
      data: [
        { name: "Sepatu Running Fallback", price: 150000, sold: 0 },
        { name: "Sepatu Casual Fallback", price: 120000, sold: 0 }
      ]
    });
  }
}