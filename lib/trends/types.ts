export type TrendPeriod = "today" | "week" | "month" | "special_day";
export type TrendMarketplace = "Shopee" | "Tokopedia" | "TikTok Shop" | "Lazada" | "Google Trends" | "Manual" | "Public Feed";
export type TrendCountry = "ID" | "MY" | "SG";
export type TrendSignal = "viral" | "rising" | "stable" | "seasonal";
export type TrendSourceKind = "official_api" | "analytics_feed" | "manual_upload" | "public_signal" | "fallback_seed" | "kalodata_like_feed";

export type MarketTrend = {
  id: string;
  productName: string;
  category: string;
  keyword: string;
  marketplace: TrendMarketplace;
  country: TrendCountry;
  period: TrendPeriod;
  demandScore: number;
  growthScore: number;
  competitionScore: number;
  priceMin: number;
  priceMax: number;
  monthlyUnits: number;
  monthlyRevenue: number;
  sold7d?: number;
  sold30d?: number;
  revenue7d?: number;
  revenue30d?: number;
  growth7d?: number;
  growth30d?: number;
  sellerCount?: number;
  creatorCount?: number;
  videoCount?: number;
  liveCount?: number;
  adCount?: number;
  avgRating?: number;
  reviewCount?: number;
  opportunityScore?: number;
  shopName?: string;
  topCreator?: string;
  topVideoViews?: number;
  topLiveRevenue?: number;
  sourceUrl?: string;
  notes?: string;
  signal: TrendSignal;
  source: string;
  sourceKind: TrendSourceKind;
  confidence: number;
  lastUpdated: string;
};

export type TrendProviderStatus = {
  id: string;
  name: string;
  kind: TrendSourceKind;
  enabled: boolean;
  status: "ready" | "config_missing" | "not_approved" | "error" | "fallback";
  message: string;
};

export type TrendQuery = {
  period?: TrendPeriod;
  country?: string;
  marketplace?: string;
  category?: string;
  q?: string;
};
