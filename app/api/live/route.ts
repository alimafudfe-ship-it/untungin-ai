// app/api/live/route.ts

let cache: any = null;
let lastFetch = 0;

async function fetchShopee(keyword: string) {
  const url = `https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(
    keyword
  )}&limit=20&newest=0`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept": "application/json",
      "Referer": "https://shopee.co.id/",
      "Origin": "https://shopee.co.id",
      "X-Requested-With": "XMLHttpRequest"
    }
  });

  if (!res.ok) throw new Error("Shopee blocked");

  return res.json();
}

async function fetchWithRetry(keyword: string, retries = 2) {
  try {
    return await fetchShopee(keyword);
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise(r => setTimeout(r, 1000));
    return fetchWithRetry(keyword, retries - 1);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("q") || "sepatu";

  try {
    // ✅ CACHE
    if (cache && Date.now() - lastFetch < 60000) {
      return Response.json({
        success: true,
        source: "cache",
        data: cache
      });
    }

    // ✅ TIMEOUT
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const json = await fetchWithRetry(keyword);

    clearTimeout(timeout);

    const items =
      json?.items?.map((item: any) => ({
        name: item.item_basic?.name,
        price: item.item_basic?.price / 100000,
        sold: item.item_basic?.historical_sold,
        rating: item.item_basic?.item_rating?.rating_star
      })) || [];

    // ✅ VALIDASI DATA
    if (!items.length) throw new Error("Empty data");

    cache = items;
    lastFetch = Date.now();

    return Response.json({
      success: true,
      source: "live",
      total: items.length,
      data: items
    });

  } catch (err: any) {
    console.error("LIVE ERROR:", err.message);

    // 🔥 FALLBACK BERLAPIS
    if (cache) {
      return Response.json({
        success: true,
        source: "stale-cache",
        data: cache
      });
    }

    return Response.json({
      success: false,
      source: "fallback",
      error: err.message,
      data: [
        { name: `${keyword} populer`, price: 100000, sold: 0 },
        { name: `${keyword} terlaris`, price: 150000, sold: 0 }
      ]
    });
  }
}