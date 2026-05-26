export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("q") || "";

  try {
    const res = await fetch(
      `https://shopee.co.id/api/v4/search/search_items?by=relevancy&keyword=${keyword}&limit=10`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      }
    );

    const data = await res.json();

    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "failed" });
  }
}
