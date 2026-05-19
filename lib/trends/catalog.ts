import type { MarketTrend, TrendPeriod } from "./types";

const updated = new Date().toISOString();

function withPeriod(item: Omit<MarketTrend, "lastUpdated">): MarketTrend {
  return { ...item, lastUpdated: updated };
}

export const FALLBACK_MARKET_TRENDS: MarketTrend[] = [
  withPeriod({ id: "seed-d-1", productName: "Serum brightening niacinamide", category: "Beauty", keyword: "serum brightening", marketplace: "Shopee", country: "ID", period: "today", demandScore: 92, growthScore: 88, competitionScore: 74, priceMin: 28000, priceMax: 79000, monthlyUnits: 18400, monthlyRevenue: 912000000, signal: "viral", source: "Fallback market-intelligence seed", sourceKind: "fallback_seed", confidence: 62 }),
  withPeriod({ id: "seed-d-2", productName: "Sunscreen SPF ringan", category: "Beauty", keyword: "sunscreen spf", marketplace: "TikTok Shop", country: "ID", period: "today", demandScore: 90, growthScore: 86, competitionScore: 69, priceMin: 35000, priceMax: 99000, monthlyUnits: 15100, monthlyRevenue: 1087000000, signal: "rising", source: "Fallback live-commerce signal", sourceKind: "fallback_seed", confidence: 61 }),
  withPeriod({ id: "seed-d-3", productName: "Organizer kabel meja kerja", category: "Home Office", keyword: "cable organizer", marketplace: "Shopee", country: "ID", period: "today", demandScore: 76, growthScore: 72, competitionScore: 38, priceMin: 9000, priceMax: 39000, monthlyUnits: 12300, monthlyRevenue: 221000000, signal: "rising", source: "Fallback low-competition signal", sourceKind: "fallback_seed", confidence: 58 }),
  withPeriod({ id: "seed-w-1", productName: "Lampu tidur LED aesthetic", category: "Home Living", keyword: "lampu tidur aesthetic", marketplace: "TikTok Shop", country: "ID", period: "week", demandScore: 84, growthScore: 91, competitionScore: 58, priceMin: 25000, priceMax: 85000, monthlyUnits: 13700, monthlyRevenue: 615000000, signal: "viral", source: "Fallback short-video trend", sourceKind: "fallback_seed", confidence: 63 }),
  withPeriod({ id: "seed-w-2", productName: "Botol minum anak anti bocor", category: "Mom & Baby", keyword: "botol minum anak", marketplace: "Tokopedia", country: "ID", period: "week", demandScore: 81, growthScore: 65, competitionScore: 44, priceMin: 24000, priceMax: 69000, monthlyUnits: 9600, monthlyRevenue: 392000000, signal: "stable", source: "Fallback search-demand signal", sourceKind: "fallback_seed", confidence: 59 }),
  withPeriod({ id: "seed-w-3", productName: "Hampers kopi lokal", category: "F&B", keyword: "hampers kopi", marketplace: "Tokopedia", country: "ID", period: "week", demandScore: 72, growthScore: 77, competitionScore: 41, priceMin: 65000, priceMax: 189000, monthlyUnits: 4100, monthlyRevenue: 486000000, signal: "seasonal", source: "Fallback seasonal demand", sourceKind: "fallback_seed", confidence: 57 }),
  withPeriod({ id: "seed-m-1", productName: "Tas selempang wanita mini", category: "Fashion", keyword: "tas selempang mini", marketplace: "Shopee", country: "ID", period: "month", demandScore: 79, growthScore: 63, competitionScore: 82, priceMin: 39000, priceMax: 149000, monthlyUnits: 21400, monthlyRevenue: 1819000000, signal: "stable", source: "Fallback category ranking", sourceKind: "fallback_seed", confidence: 60 }),
  withPeriod({ id: "seed-m-2", productName: "Instant shawl ironless", category: "Fashion", keyword: "instant shawl", marketplace: "Shopee", country: "MY", period: "month", demandScore: 88, growthScore: 84, competitionScore: 64, priceMin: 32000, priceMax: 118000, monthlyUnits: 14900, monthlyRevenue: 1220000000, signal: "rising", source: "Fallback regional trend", sourceKind: "fallback_seed", confidence: 60 }),
  withPeriod({ id: "seed-m-3", productName: "Minimalist desk mat", category: "Home Office", keyword: "desk mat", marketplace: "Shopee", country: "SG", period: "month", demandScore: 71, growthScore: 68, competitionScore: 29, priceMin: 45000, priceMax: 159000, monthlyUnits: 3900, monthlyRevenue: 392000000, signal: "rising", source: "Fallback low-saturation signal", sourceKind: "fallback_seed", confidence: 56 }),
];

export function fallbackForPeriod(period: TrendPeriod) {
  return FALLBACK_MARKET_TRENDS.filter((item) => item.period === period);
}
