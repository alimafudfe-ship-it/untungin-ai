// Untungin AI - Central Metrics Engine
// Single source of truth for all business calculations

export type Product = {
  id: string;
  user_id?: string;
  name: string;
  sku: string;

  cost_price: number;
  selling_price: number;
  other_cost?: number;

  quantity_sold: number;

  stock_initial: number;
  stock_remaining: number;

  created_at: string;
};

// ================================
// SAFE NUMBER HANDLER
// ================================

function safe(n: any): number {
  return Number(n) || 0;
}

// ================================
// CORE CALCULATIONS
// ================================

export function calculateProfit(p: Product): number {
  return (
    (safe(p.selling_price) -
      safe(p.cost_price) -
      safe(p.other_cost)) *
    safe(p.quantity_sold)
  );
}

export function calculateMargin(p: Product): number {
  const selling = safe(p.selling_price);
  if (selling === 0) return 0;

  return (
    (selling - safe(p.cost_price) - safe(p.other_cost)) /
    selling
  );
}

export function calculateRevenue(p: Product): number {
  return safe(p.selling_price) * safe(p.quantity_sold);
}

// ================================
// PRODUCT ENRICHMENT
// ================================

export function enrichProducts(products: Product[]) {
  return products.map((p) => {
    const profit = calculateProfit(p);
    const margin = calculateMargin(p);
    const revenue = calculateRevenue(p);

    return {
      ...p,
      profit,
      margin,
      revenue,

      is_loss: profit < 0,
      is_low_margin: margin < 0.1,
      is_dead_stock:
        safe(p.stock_remaining) > 0 && safe(p.quantity_sold) === 0,
    };
  });
}

// ================================
// PROFIT INTELLIGENCE
// ================================

export function getTopProfitProducts(products: any[], limit = 5) {
  return [...products]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit);
}

export function getLossProducts(products: any[], limit = 5) {
  return [...products]
    .filter((p) => p.profit < 0)
    .sort((a, b) => a.profit - b.profit)
    .slice(0, limit);
}

// ================================
// INVENTORY INTELLIGENCE
// ================================

function getDaysActive(p: Product) {
  const created = new Date(p.created_at).getTime();
  const now = Date.now();

  const days = (now - created) / (1000 * 60 * 60 * 24);
  return Math.max(days, 1);
}

export function calculateDailySales(p: Product) {
  return safe(p.quantity_sold) / getDaysActive(p);
}

export function getRestockInsights(products: any[]) {
  return products.map((p) => {
    const daily_sales = calculateDailySales(p);

    const days_left =
      daily_sales > 0
        ? safe(p.stock_remaining) / daily_sales
        : Infinity;

    return {
      ...p,
      daily_sales,
      days_left,

      is_low_stock: days_left < 3,
      is_out_of_stock: safe(p.stock_remaining) <= 0,
    };
  });
}

export function getDeadStock(products: any[]) {
  return products.filter((p) => p.is_dead_stock);
}

// ================================
// BUSINESS SUMMARY (AI READY)
// ================================

export function getBusinessSummary(products: Product[]) {
  const enriched = enrichProducts(products);
  const restockData = getRestockInsights(enriched);

  const total_revenue = enriched.reduce(
    (sum, p) => sum + p.revenue,
    0
  );

  const total_profit = enriched.reduce(
    (sum, p) => sum + p.profit,
    0
  );

  const avg_margin =
    enriched.length > 0
      ? enriched.reduce((sum, p) => sum + p.margin, 0) /
        enriched.length
      : 0;

  return {
    total_products: enriched.length,
    total_revenue,
    total_profit,
    avg_margin,

    top_products: getTopProfitProducts(enriched),
    loss_products: getLossProducts(enriched),

    dead_stock: getDeadStock(enriched),

    low_stock: restockData.filter((p) => p.is_low_stock),

    insights_flags: {
      has_loss: enriched.some((p) => p.is_loss),
      has_dead_stock: enriched.some((p) => p.is_dead_stock),
      low_margin_count: enriched.filter((p) => p.is_low_margin).length,
    },
  };
}