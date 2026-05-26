export const runtime = "edge";

let cache: any = null;
let lastFetch = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("q") || "sepatu";

  try {
    // ✅ CACHE (tetap dipakai)
    if (cache && Date.now() - lastFetch < 60000) {
      return Response.json({
        success: true,
        source: "cache",
        data: cache,
      });
    }

    // ✅ FETCH DIRECT (NO RETRY)
    const url = `https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(
      keyword
    )}&limit=20&newest=0`;

    const res = await fetch(url, {
      headers: {
        "accept": "application/json",
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile Safari/604.1",
        "referer": "https://shopee.co.id/",
        "x-requested-with": "XMLHttpRequest",
      },
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Shopee blocked");

    const json = await res.json();

    const items =
      json?.items?.map((item: any) => ({
        name: item.item_basic?.name,
        price: item.item_basic?.price / 100000,
        sold: item.item_basic?.historical_sold,
        rating: item.item_basic?.item_rating?.rating_star,
      })) || [];

    if (!items.length) throw new Error("Empty data");

    cache = items;
    lastFetch = Date.now();

    return Response.json({
      success: true,
      source: "live",
      data: items,
    });

  } catch (err: any) {
    console.error("LIVE ERROR:", err.message);

    // ✅ FALLBACK WAJIB ADA
    return Response.json({
      success: true,
      source: "fallback",
      data: [
        { name: `${keyword} populer`, price: 100000, sold: 100 },
        { name: `${keyword} terlaris`, price: 150000, sold: 250 },
      ],
    });
  }
}