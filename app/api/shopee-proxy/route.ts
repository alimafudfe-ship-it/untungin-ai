export const runtime = "nodejs";
export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("q") || "sepatu";

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

  if (!res.ok) {
    return new Response(JSON.stringify({ error: "blocked" }), {
      status: 500,
    });
  }

  const json = await res.json();

  return Response.json(json);
}
