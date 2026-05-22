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
    id: String(row.id || `${sourceKind}-${source}-${index + 1}`),
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

const FEED_CONFIGS = [
  { env: "TREND_FEED_URL", id: "trend-feed", name: "Feed tren eksternal aktif", source: "Custom trend feed" },
  { env: "SHOPEE_ANALYTICS_FEED_URL", id: "shopee-feed", name: "Shopee Trend feed aktif", source: "Shopee Analytics feed" },
  { env: "TIKTOK_ANALYTICS_FEED_URL", id: "tiktok-feed", name: "TikTok Shop Trend feed aktif", source: "TikTok Shop Analytics feed" },
  { env: "TOKOPEDIA_ANALYTICS_FEED_URL", id: "tokopedia-feed", name: "Tokopedia Trend feed aktif", source: "Tokopedia Analytics feed" },
  { env: "LAZADA_ANALYTICS_FEED_URL", id: "lazada-feed", name: "Lazada Trend feed aktif", source: "Lazada Analytics feed" },
] as const;

export function getTrendProviderStatuses(): TrendProviderStatus[] {
  const shopeeApproved = Boolean(process.env.SHOPEE_PARTNER_ID && process.env.SHOPEE_PARTNER_KEY && process.env.SHOPEE_REDIRECT_URL);
  const tiktokApproved = Boolean(process.env.TIKTOK_SHOP_CLIENT_KEY && process.env.TIKTOK_SHOP_CLIENT_SECRET && process.env.TIKTOK_SHOP_REDIRECT_URI);
  const statuses: TrendProviderStatus[] = [
    { id: "reviewer-demo", name: "Demo multi marketplace aktif", kind: "fallback_seed", enabled: true, status: "fallback", message: "Data sampel Shopee, TikTok Shop, Tokopedia, dan Lazada siap diuji." },
  ];

  for (const feed of FEED_CONFIGS) {
    if (process.env[feed.env]) {
      statuses.push({ id: feed.id, name: feed.name, kind: "analytics_feed", enabled: true, status: "ready", message: `${feed.env} terhubung.` });
    }
  }

  if (shopeeApproved) statuses.push({ id: "shopee-api", name: "Shopee API credentials tersedia", kind: "official_api", enabled: true, status: "ready", message: "Siap dipakai untuk data toko setelah approval use case." });
  if (tiktokApproved) statuses.push({ id: "tiktok-api", name: "TikTok Shop API credentials tersedia", kind: "official_api", enabled: true, status: "ready", message: "Siap dipakai untuk data toko setelah approval scopes." });
  return statuses;
}

export async function collectMarketplaceTrends(query: TrendQuery = {}) {
  const errors: string[] = [];
  const items: MarketTrend[] = [...FALLBACK_MARKET_TRENDS];

  for (const feed of FEED_CONFIGS) {
    const url = process.env[feed.env];
    if (!url) continue;
    try {
      items.push(...await readJsonFeed(url, feed.source, "analytics_feed"));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `${feed.env} gagal dibaca.`);
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
