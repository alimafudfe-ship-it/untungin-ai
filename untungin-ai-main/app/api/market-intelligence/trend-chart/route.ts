import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Number(url.searchParams.get("days") || 7);
  const marketplace = url.searchParams.get("marketplace") || "All";

  const now = Date.now();
  const data = Array.from({ length: days }).map((_, i) => ({
    snapshot_date: new Date(now - (days - i) * 86400000).toISOString().slice(0,10),
    sales: Math.floor(Math.random() * 1000),
    revenue: Math.floor(Math.random() * 10000000),
    marketplace,
  }));

  return NextResponse.json({ ok: true, days, marketplace, data });
}
