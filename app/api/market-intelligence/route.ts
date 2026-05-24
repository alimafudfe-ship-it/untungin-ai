import { NextResponse } from "next/server";
import { collectMarketIntelligence } from "@/lib/market-intelligence/providers";
import type { MITrendPeriod, MISortKey } from "@/lib/market-intelligence/types";

function period(value: string | null): MITrendPeriod | undefined {
  const normalized = String(value || "").toLowerCase().replace(/[\s-]+/g, "_");
  if (["today", "daily", "day", "hari", "harian"].includes(normalized)) return "today";
  if (["week", "weekly", "minggu", "mingguan"].includes(normalized)) return "week";
  if (["month", "monthly", "bulan", "bulanan"].includes(normalized)) return "month";
  if (["special_day", "special_days", "holiday", "holidays", "seasonal", "hari_besar"].includes(normalized)) return "special_day";
  return undefined;
}

function sort(value: string | null): MISortKey | undefined {
  const normalized = String(value || "").toLowerCase();
  if (["opportunity", "sales", "revenue", "growth", "competition", "updated"].includes(normalized)) return normalized as MISortKey;
  return undefined;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const result = await collectMarketIntelligence({
    period: period(url.searchParams.get("period")) || undefined,
    country: url.searchParams.get("country") || "All",
    marketplace: url.searchParams.get("marketplace") || "All",
    category: url.searchParams.get("category") || "All",
    q: url.searchParams.get("q") || "",
    sort: sort(url.searchParams.get("sort")) || "opportunity",
  });
  return NextResponse.json(result);
}
