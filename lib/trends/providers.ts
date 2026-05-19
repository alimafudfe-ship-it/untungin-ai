import { FALLBACK_MARKET_TRENDS } from "./catalog";
import { dedupeTrends, filterTrends } from "./scoring";
import type { MarketTrend, TrendPeriod, TrendProviderStatus, TrendQuery, TrendSignal, TrendSourceKind } from "./types";

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeSignal(value: unknown): TrendSignal {
  const normalized = String(value || "").toLowerCase();
  if (["viral", "rising", "stable", "seasonal"].includes(normalized)) return normalized as TrendSignal;
  return "rising";
}

function normalizePeriod(value: unknown): TrendPeriod {
  const normalized = String(value || "week").toLowerCase().replace(/[\s-]+/g, "_");
  if (["today", "daily", "day", "hari", "harian"].includes(normalized)) return "today";
  if (["week", "weekly", "minggu", "mingguan"].includes(normalized)) return "week";
  if (["month", "monthly", "bulan", "bulanan"].includes(normalized)) return "month";
  if (["special_day", "special_days", "holiday", "holidays", "seasonal", "hari_besar", "har2_besar", "har2_bisar"].includes(normalized)) return "special_day";
  return "week";
}

function normalizeTrend(row: Record<string, unknown>, index: number, source: string, sourceKind: TrendSourceKind): MarketTrend {
  return {
    id: String(row.id || `${sourceKind}-${index + 1}`),
    productName: String(row.productName || row.product_name || row.name || row.keyword || `Trend ${index + 1}`),
    category: String(row.category || "General"),
    keyword: String(row.keyword || row.productName || row.product_name || row.name || `trend-${index + 1}`),
    marketplace: String(row.marketplace || "Public Feed") as MarketTrend["marketplace"],
    country: String(row.country || "ID") as MarketTrend["country"],
    period: normalizePeriod(row.period ?? row.trendPeriod ?? row.trend_period),
    demandScore: toNumber(row.demandScore ?? row.demand_score ?? row.demand, 50),
    growthScore: toNumber(row.growthScore ?? row.growth_score ?? row.growth, 50),
    competitionScore: toNumber(row.competitionScore ?? row.competition_score ?? row.competition, 50),
    priceMin: toNumber(row.priceMin ?? row.price_min ?? row.min_price, 0),
    priceMax: toNumber(row.priceMax ?? row.price_max ?? row.max_price, 0),
    monthlyUnits: toNumber(row.monthlyUnits ?? row.monthly_units ?? row.units, 0),
    monthlyRevenue: toNumber(row.monthlyRevenue ?? row.monthly_revenue ?? row.revenue, 0),
    signal: normalizeSignal(row.signal),
    source: String(row.source || source),
    sourceKind,
    confidence: toNumber(row.confidence, sourceKind === "fallback_seed" ? 60 : 78),
    lastUpdated: String(row.lastUpdated || row.last_updated || new Date().toISOString()),
  };
}

async function readJsonFeed(url: string, source: string, sourceKind: TrendSourceKind) {
  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`${source} gagal dibaca: ${response.status}`);
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
  return rows.map((row: Record<string, unknown>, index: number) => normalizeTrend(row, index, source, sourceKind));
}

export function getTrendProviderStatuses(): TrendProviderStatus[] {
  const genericFeedReady = Boolean(process.env.TREND_FEED_URL);
  const shopeeAnalyticsReady = Boolean(process.env.SHOPEE_ANALYTICS_FEED_URL);
  const shopeeApproved = Boolean(process.env.SHOPEE_PARTNER_ID && process.env.SHOPEE_PARTNER_KEY && process.env.SHOPEE_REDIRECT_URL);

  return [
    { id: "fallback", name: "Built-in fallback seed", kind: "fallback_seed", enabled: true, status: "fallback", message: "Aktif agar fitur tren tetap jalan tanpa approval marketplace." },
    { id: "trend-feed", name: "Custom TREND_FEED_URL", kind: "analytics_feed", enabled: genericFeedReady, status: genericFeedReady ? "ready" : "config_missing", message: genericFeedReady ? "JSON trend feed aktif." : "Set TREND_FEED_URL untuk sumber tren eksternal." },
    { id: "shopee-analytics", name: "Shopee Analytics feed", kind: "analytics_feed", enabled: shopeeAnalyticsReady, status: shopeeAnalyticsReady ? "ready" : "config_missing", message: shopeeAnalyticsReady ? "Feed analytics Shopee aktif." : "Set SHOPEE_ANALYTICS_FEED_URL bila memakai export/API pihak ketiga." },
    { id: "shopee-official", name: "Shopee official API", kind: "official_api", enabled: false, status: shopeeApproved ? "not_approved" : "config_missing", message: shopeeApproved ? "Credential ada, tapi endpoint tren publik tetap butuh approval/use case resmi." : "Belum dikonfigurasi atau belum approved; fitur memakai fallback/provider lain." },
  ];
}

export async function collectMarketplaceTrends(query: TrendQuery = {}) {
  const errors: string[] = [];
  const items: MarketTrend[] = [...FALLBACK_MARKET_TRENDS];

  if (process.env.TREND_FEED_URL) {
    try {
      items.push(...await readJsonFeed(process.env.TREND_FEED_URL, "Custom trend feed", "analytics_feed"));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "TREND_FEED_URL gagal dibaca.");
    }
  }

  if (process.env.SHOPEE_ANALYTICS_FEED_URL) {
    try {
      items.push(...await readJsonFeed(process.env.SHOPEE_ANALYTICS_FEED_URL, "Shopee Analytics feed", "analytics_feed"));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "SHOPEE_ANALYTICS_FEED_URL gagal dibaca.");
    }
  }

  const deduped = dedupeTrends(items);
  return {
    items: filterTrends(deduped, query),
    providers: getTrendProviderStatuses(),
    errors,
    generatedAt: new Date().toISOString(),
  };
}
