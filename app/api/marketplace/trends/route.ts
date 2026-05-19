import { NextResponse } from "next/server";
import { collectMarketplaceTrends } from "@/lib/trends/providers";
import type { TrendPeriod } from "@/lib/trends/types";

function period(value: string | null): TrendPeriod | undefined {
  return value === "today" || value === "week" || value === "month" ? value : undefined;
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
