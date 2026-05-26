import type { MIBundle, MICategory, MICreator, MILivestream, MIProduct, MIQuery, MIResearchSource, MIShop, MIVideoAd } from "./types";

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

export function scoreProduct(item: MIProduct) {
  if (item.opportunityScore > 0) return clamp(item.opportunityScore);
  const competitionOpportunity = 100 - item.competitionScore;
  const salesSignal = clamp(Math.log10(item.sold30d + 1) * 16);
  const marginSignal = clamp(item.marginSignal || 50);
  return clamp(item.demandScore * 0.32 + item.growthScore * 0.26 + competitionOpportunity * 0.18 + salesSignal * 0.08 + marginSignal * 0.16);
}

export function scoreCategory(item: MICategory) {
  if (item.opportunityScore > 0) return clamp(item.opportunityScore);
  return clamp(item.demandScore * 0.35 + item.growthScore * 0.3 + (100 - item.competitionScore) * 0.2 + Math.log10(item.revenue30d + 1) * 2);
}

export function scoreShop(item: MIShop) {
  return clamp(Math.log10(item.revenue30d + 1) * 6 + item.avgRating * 10 + Math.log10(item.followers + 1) * 8 + item.liveCount * 0.25 + item.adCount * 0.25);
}

export function scoreCreator(item: MICreator) {
  return clamp(item.fitScore || Math.log10(item.followers + 1) * 9 + item.engagementRate * 7 + Math.log10(item.revenue30d + 1) * 3);
}

export function scoreVideo(item: MIVideoAd) {
  return clamp(Math.log10(item.views + 1) * 14 + item.ctr * 7 + item.cvr * 8 + Math.log10(item.gmvEstimate + 1) * 2);
}

export function scoreLive(item: MILivestream) {
  return clamp(Math.log10(item.revenue + 1) * 5 + Math.log10(item.viewersPeak + 1) * 9 + item.conversionRate * 8 + Math.log10(item.soldUnits + 1) * 8);
}

function matchesText(values: unknown[], q: string) {
  if (!q) return true;
  return values.join(" ").toLowerCase().includes(q);
}

function matchProduct(item: MIProduct, query: MIQuery) {
  const q = String(query.q || "").trim().toLowerCase();
  return matchesText([item.productName, item.keyword, item.category, item.subcategory, item.marketplace, item.notes], q)
    && (!query.period || item.period === query.period)
    && (!query.country || query.country === "All" || item.country === query.country)
    && (!query.marketplace || query.marketplace === "All" || item.marketplace === query.marketplace)
    && (!query.category || query.category === "All" || item.category === query.category);
}

function matchSource(item: MIResearchSource, query: MIQuery) {
  const q = String(query.q || "").trim().toLowerCase();
  return matchesText([item.title, item.keyword, item.category, item.marketplace, item.sourceType, item.status, item.sourceUrl, item.notes], q)
    && (!query.country || query.country === "All" || item.country === query.country)
    && (!query.marketplace || query.marketplace === "All" || item.marketplace === query.marketplace)
    && (!query.category || query.category === "All" || item.category === query.category);
}

export function filterProducts(items: MIProduct[], query: MIQuery = {}) {
  const rows = items.filter((item) => matchProduct(item, query));
  const sort = query.sort || "opportunity";
  return rows.sort((a, b) => {
    if (sort === "sales") return b.sold30d - a.sold30d;
    if (sort === "revenue") return b.revenue30d - a.revenue30d;
    if (sort === "growth") return b.growth30d - a.growth30d;
    if (sort === "competition") return a.competitionScore - b.competitionScore;
    if (sort === "updated") return new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime();
    return scoreProduct(b) - scoreProduct(a);
  });
}

export function filterBundle(bundle: MIBundle, query: MIQuery = {}): MIBundle {
  const products = filterProducts(bundle.products, query);
  const productIds = new Set(products.map((item) => item.id));
  const shopIds = new Set(products.flatMap((item) => item.shopIds));
  const creatorIds = new Set(products.flatMap((item) => item.creatorIds));
  const videoIds = new Set(products.flatMap((item) => item.videoIds));
  const liveIds = new Set(products.flatMap((item) => item.liveIds));
  const q = String(query.q || "").trim().toLowerCase();

  return {
    ...bundle,
    products,
    categories: bundle.categories
      .filter((item) => (!query.country || query.country === "All" || item.country === query.country)
        && (!query.marketplace || query.marketplace === "All" || item.marketplace === "All" || item.marketplace === query.marketplace)
        && (!query.category || query.category === "All" || item.name === query.category)
        && matchesText([item.name, item.parent, item.topKeywords.join(" "), item.notes], q))
      .sort((a, b) => scoreCategory(b) - scoreCategory(a)),
    shops: bundle.shops
      .filter((item) => (shopIds.size === 0 || shopIds.has(item.id) || !query.category || query.category === "All")
        && (!query.country || query.country === "All" || item.country === query.country)
        && (!query.marketplace || query.marketplace === "All" || item.marketplace === query.marketplace)
        && (!query.category || query.category === "All" || item.categoryFocus === query.category)
        && matchesText([item.shopName, item.categoryFocus, item.marketplace, item.opportunityGap, item.notes], q))
      .sort((a, b) => scoreShop(b) - scoreShop(a)),
    creators: bundle.creators
      .filter((item) => (creatorIds.size === 0 || creatorIds.has(item.id) || !query.category || query.category === "All")
        && (!query.country || query.country === "All" || item.country === query.country)
        && (!query.marketplace || query.marketplace === "All" || item.marketplace === query.marketplace)
        && (!query.category || query.category === "All" || item.categoryFocus === query.category)
        && matchesText([item.creatorName, item.handle, item.categoryFocus, item.marketplace, item.notes], q))
      .sort((a, b) => scoreCreator(b) - scoreCreator(a)),
    videos: bundle.videos
      .filter((item) => (videoIds.size === 0 || videoIds.has(item.id) || productIds.has(item.productId))
        && (!query.country || query.country === "All" || item.country === query.country)
        && (!query.marketplace || query.marketplace === "All" || item.marketplace === query.marketplace)
        && matchesText([item.title, item.format, item.hook, item.cta, item.notes], q))
      .sort((a, b) => scoreVideo(b) - scoreVideo(a)),
    lives: bundle.lives
      .filter((item) => (liveIds.size === 0 || liveIds.has(item.id) || item.productIds.some((productId) => productIds.has(productId)))
        && (!query.country || query.country === "All" || item.country === query.country)
        && (!query.marketplace || query.marketplace === "All" || item.marketplace === query.marketplace)
        && (!query.category || query.category === "All" || item.categoryFocus === query.category)
        && matchesText([item.title, item.hostName, item.hostType, item.categoryFocus, item.notes], q))
      .sort((a, b) => scoreLive(b) - scoreLive(a)),
    sources: (bundle.sources || [])
      .filter((item) => matchSource(item, query))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()),
  };
}

export function summarizeBundle(bundle: MIBundle) {
  const totalRevenue = bundle.products.reduce((sum, item) => sum + item.revenue30d, 0);
  const totalSales = bundle.products.reduce((sum, item) => sum + item.sold30d, 0);
  const topProduct = bundle.products[0] || null;
  const lowCompetition = bundle.products.filter((item) => item.demandScore >= 70 && item.competitionScore <= 50).sort((a, b) => scoreProduct(b) - scoreProduct(a))[0] || null;
  const avgOpportunity = bundle.products.length ? bundle.products.reduce((sum, item) => sum + scoreProduct(item), 0) / bundle.products.length : 0;
  return { totalRevenue, totalSales, topProduct, lowCompetition, avgOpportunity };
}
