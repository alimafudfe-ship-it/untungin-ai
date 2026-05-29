export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { collectMarketplaceTrends } from "@/lib/trends/providers";
import type { TrendPeriod } from "@/lib/trends/types";

function period(value: string | null): TrendPeriod | undefined {
  const normalized = String(value || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (["today", "daily", "day", "hari", "harian"].includes(normalized)) return "today";
  if (["week", "weekly", "minggu", "mingguan"].includes(normalized)) return "week";
  if (["month", "monthly", "bulan", "bulanan"].includes(normalized)) return "month";
  if (["special_day", "special_days", "holiday", "holidays", "seasonal", "hari_besar", "har2_besar", "har2_bisar"].includes(normalized)) return "special_day";
  return undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const result = await collectMarketplaceTrends({
    period: period(url.searchParams.get("period")) || "week",
    country: url.searchParams.get("country") || "All",
    marketplace: url.searchParams.get("marketplace") || "All",
    category: url.searchParams.get("category") || "All",
    q: url.searchParams.get("q") || "",
  });
  return NextResponse.json(result);
}
