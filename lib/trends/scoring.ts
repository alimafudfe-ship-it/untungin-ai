import type { MarketTrend, TrendQuery } from "./types";

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

export function scoreTrend(item: MarketTrend) {
  if (item.opportunityScore && item.opportunityScore > 0) return clamp(item.opportunityScore);

  const competitionOpportunity = 100 - item.competitionScore;
  const salesSignal = clamp(Math.log10((item.sold30d || item.monthlyUnits || 0) + 1) * 16);
  const creatorSignal = clamp(Math.log10((item.creatorCount || 0) + (item.videoCount || 0) + 1) * 12);

  return clamp(
    item.demandScore * 0.35 +
    item.growthScore * 0.3 +
    competitionOpportunity * 0.2 +
    item.confidence * 0.08 +
    salesSignal * 0.04 +
    creatorSignal * 0.03
  );
}

export function filterTrends(items: MarketTrend[], query: TrendQuery = {}) {
  const normalized = String(query.q || "").trim().toLowerCase();
  return items.filter((item) => {
    const matchQuery = !normalized || [item.productName, item.keyword, item.category, item.marketplace, item.source]
      .join(" ")
      .toLowerCase()
      .includes(normalized);
    const matchPeriod = !query.period || item.period === query.period;
    const matchCountry = !query.country || query.country === "All" || item.country === query.country;
    const matchMarketplace = !query.marketplace || query.marketplace === "All" || item.marketplace === query.marketplace;
    const matchCategory = !query.category || query.category === "All" || item.category === query.category;
    return matchQuery && matchPeriod && matchCountry && matchMarketplace && matchCategory;
  }).sort((a, b) => scoreTrend(b) - scoreTrend(a));
}

export function dedupeTrends(items: MarketTrend[]) {
  const map = new Map<string, MarketTrend>();
  for (const item of items) {
    const key = `${item.period}:${item.country}:${item.marketplace}:${item.keyword}`.toLowerCase();
    const existing = map.get(key);
    if (!existing || scoreTrend(item) > scoreTrend(existing) || item.confidence > existing.confidence) map.set(key, item);
  }
  return Array.from(map.values()).sort((a, b) => scoreTrend(b) - scoreTrend(a));
}
