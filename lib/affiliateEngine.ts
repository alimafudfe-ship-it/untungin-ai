// ======================================
// UNTUNGIN AI - AFFILIATE ENGINE
// ======================================

export type Affiliate = {
  id: string;
  name: string;
  platform: string; // tiktok, shopee
  product_id: string;

  revenue: number;
  orders: number;
  commission: number;
  conversion_rate: number;
};

// ================================
// SAFE
// ================================

function safe(n: any): number {
  return Number(n) || 0;
}

// ================================
// CORE METRICS
// ================================

export function calculateAffiliateScore(a: Affiliate) {
  const revenueScore = safe(a.revenue) * 0.5;
  const conversionScore = safe(a.conversion_rate) * 100 * 0.3;
  const ordersScore = safe(a.orders) * 0.2;

  return revenueScore + conversionScore + ordersScore;
}

// ================================
// RANKING
// ================================

export function rankAffiliates(affiliates: Affiliate[]) {
  return affiliates
    .map((a) => ({
      ...a,
      score: calculateAffiliateScore(a),
    }))
    .sort((a, b) => b.score - a.score);
}

// ================================
// INSIGHT ENGINE
// ================================

export function getAffiliateInsights(affiliates: Affiliate[]) {
  if (!affiliates.length) return null;

  const ranked = rankAffiliates(affiliates);

  const top = ranked[0];
  const worst = ranked[ranked.length - 1];

  const totalRevenue = affiliates.reduce(
    (sum, a) => sum + safe(a.revenue),
    0
  );

  const topShare =
    totalRevenue > 0 ? safe(top.revenue) / totalRevenue : 0;

  return {
    top_affiliate: top,
    worst_affiliate: worst,

    insights: {
      concentration_risk: topShare > 0.6,
      low_performers: ranked.filter((a) => a.score < 50).length,
    },
  };
}

// ================================
// AI RECOMMENDATION ENGINE
// ================================

export function getAffiliateRecommendations(affiliates: Affiliate[]) {
  const insights = getAffiliateInsights(affiliates);

  if (!insights) return [];

  const actions: string[] = [];

  if (insights.insights.concentration_risk) {
    actions.push(
      `⚠️ Revenue terlalu tergantung pada ${insights.top_affiliate.name}. Cari affiliate tambahan.`
    );
  }

  if (insights.insights.low_performers > 0) {
    actions.push(
      `❌ Ada ${insights.insights.low_performers} affiliate performa rendah. Evaluasi atau hentikan.`
    );
  }

  actions.push(
    `🚀 Scale affiliate terbaik: ${insights.top_affiliate.name}`
  );

  return actions;
}