export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { collectMarketIntelligence } from "@/lib/market-intelligence/providers";
import type { MITrendPeriod, MISortKey } from "@/lib/market-intelligence/types";
import { ShopeeCrawler } from "@/services/crawlers/shopeeCrawler";
import { TokopediaCrawler } from "@/services/crawlers/tokopediaCrawler";
import { LazadaCrawler } from "@/services/crawlers/lazadaCrawler";
import { calculateOpportunityScore } from "@/services/ai/opportunityScore";

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
  const q = url.searchParams.get("q") || "";

  const result = await collectMarketIntelligence({
    period: period(url.searchParams.get("period")) || undefined,
    country: url.searchParams.get("country") || "All",
    marketplace: url.searchParams.get("marketplace") || "All",
    category: url.searchParams.get("category") || "All",
    q,
    sort: sort(url.searchParams.get("sort")) || "opportunity",
  });

  if (result.products?.length) {
    return NextResponse.json(result);
  }

  if (!q.trim()) {
    return NextResponse.json(result);
  }

  try {
    const shopee = await new ShopeeCrawler().scan(q);
    const tokopedia = await new TokopediaCrawler().scan(q);
    const lazada = await new LazadaCrawler().scan(q);

    const merged = [...shopee, ...tokopedia, ...lazada].map((item: any, index: number) => {
      const opportunity = item.opportunity_score || calculateOpportunityScore(item);

      return {
        id: `${item.marketplace}-${index}`,
        name: item.product_name,
        marketplace: item.marketplace,
        country: "ID",
        category: "Trending",
        keyword: q,
        imageUrl: "",
        priceMin: Number(item.price || 0),
        priceMax: Number(item.price || 0),
        sold7d: Number(item.sales || 0),
        sold30d: Number(item.sales || 0),
        revenue7d: Number(item.sales || 0) * Number(item.price || 0),
        revenue30d: Number(item.sales || 0) * Number(item.price || 0),
        growth7d: 20,
        growth30d: 25,
        rating: Number(item.rating || 0),
        reviewCount: Number(item.sales || 0),
        demandScore: opportunity,
        growthScore: opportunity,
        competitionScore: 40,
        opportunityScore: opportunity,
        signal: "rising",
        source: item.marketplace,
        sourceUrl: "",
        updatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      ...result,
      products: merged,
      categories: [
        {
          id: "trending",
          name: q,
          marketplace: "Shopee",
          opportunityScore: 80,
          demandScore: 80,
          growthScore: 78,
          competitionScore: 40,
          signal: "rising",
        },
      ],
      rowCount: merged.length,
      dataMode: "live",
      activeSource: "Marketplace API Live",
      isDemo: false,
    });
  } catch (error) {
    return NextResponse.json(result);
  }
}
