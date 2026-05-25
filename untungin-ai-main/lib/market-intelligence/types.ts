export type MITrendPeriod = "today" | "week" | "month" | "special_day";
export type MIMarketplace = "All" | "Shopee" | "TikTok Shop" | "Tokopedia" | "Lazada" | "Manual" | "Public Feed";
export type MICountry = "ID" | "MY" | "SG";
export type MISignal = "viral" | "rising" | "stable" | "seasonal" | "declining";
export type MISourceKind = "official_api" | "partner_feed" | "manual_upload" | "public_signal" | "demo_seed" | "csv_import" | "marketplace_link" | "json_import";
export type MISourceType = "search" | "product" | "shop" | "category" | "creator" | "video" | "live" | "keyword" | "other";
export type MISourceStatus = "draft" | "queued" | "active" | "checked" | "failed" | "archived";
export type MIVideoFormat = "organic" | "affiliate_video" | "ad" | "shop_video";
export type MILiveHostType = "seller" | "creator" | "brand";
export type MISortKey = "opportunity" | "sales" | "revenue" | "growth" | "competition" | "updated";

export type MIProduct = {
  id: string;
  productName: string;
  category: string;
  subcategory?: string;
  keyword: string;
  marketplace: Exclude<MIMarketplace, "All">;
  country: MICountry;
  period: MITrendPeriod;
  priceMin: number;
  priceMax: number;
  sold7d: number;
  sold30d: number;
  revenue7d: number;
  revenue30d: number;
  growth7d: number;
  growth30d: number;
  sellerCount: number;
  creatorCount: number;
  videoCount: number;
  liveCount: number;
  adCount: number;
  avgRating: number;
  reviewCount: number;
  demandScore: number;
  growthScore: number;
  competitionScore: number;
  opportunityScore: number;
  saturationScore: number;
  marginSignal: number;
  signal: MISignal;
  source: string;
  sourceKind: MISourceKind;
  sourceUrl?: string;
  collectedAt: string;
  shopIds: string[];
  creatorIds: string[];
  videoIds: string[];
  liveIds: string[];
  notes?: string;
};

export type MICategory = {
  id: string;
  name: string;
  parent?: string;
  marketplace: MIMarketplace;
  country: MICountry;
  productCount: number;
  sold30d: number;
  revenue30d: number;
  demandScore: number;
  growthScore: number;
  competitionScore: number;
  opportunityScore: number;
  topKeywords: string[];
  notes?: string;
};

export type MIShop = {
  id: string;
  shopName: string;
  marketplace: Exclude<MIMarketplace, "All">;
  country: MICountry;
  categoryFocus: string;
  productCount: number;
  sold30d: number;
  revenue30d: number;
  avgPrice: number;
  avgRating: number;
  reviewCount: number;
  followers: number;
  liveCount: number;
  adCount: number;
  topProductId?: string;
  opportunityGap: string;
  source: string;
  sourceKind: MISourceKind;
  collectedAt: string;
  notes?: string;
};

export type MICreator = {
  id: string;
  creatorName: string;
  handle: string;
  marketplace: Exclude<MIMarketplace, "All">;
  country: MICountry;
  categoryFocus: string;
  followers: number;
  avgViews: number;
  engagementRate: number;
  productCount: number;
  sold30d: number;
  revenue30d: number;
  commissionRate: number;
  fitScore: number;
  topProductId?: string;
  source: string;
  sourceKind: MISourceKind;
  collectedAt: string;
  notes?: string;
};

export type MIVideoAd = {
  id: string;
  title: string;
  format: MIVideoFormat;
  productId: string;
  creatorId?: string;
  marketplace: Exclude<MIMarketplace, "All">;
  country: MICountry;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  ctr: number;
  cvr: number;
  gmvEstimate: number;
  hook: string;
  cta: string;
  durationSec: number;
  postedAt: string;
  sourceUrl?: string;
  source: string;
  sourceKind: MISourceKind;
  notes?: string;
};

export type MILivestream = {
  id: string;
  title: string;
  hostName: string;
  hostType: MILiveHostType;
  marketplace: Exclude<MIMarketplace, "All">;
  country: MICountry;
  categoryFocus: string;
  productIds: string[];
  viewersPeak: number;
  durationMin: number;
  soldUnits: number;
  revenue: number;
  conversionRate: number;
  liveDate: string;
  sourceUrl?: string;
  source: string;
  sourceKind: MISourceKind;
  notes?: string;
};


export type MIResearchSource = {
  id: string;
  title: string;
  marketplace: Exclude<MIMarketplace, "All">;
  sourceType: MISourceType;
  sourceUrl: string;
  keyword?: string;
  category?: string;
  country: MICountry;
  status: MISourceStatus;
  lastCheckedAt?: string;
  nextCheckAt?: string;
  extractedCount: number;
  createdBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type MIProviderStatus = {
  id: string;
  name: string;
  kind: MISourceKind;
  enabled: boolean;
  status: "ready" | "config_missing" | "error" | "demo";
  message: string;
};

export type MIDataMode = "supabase" | "feed" | "mixed" | "demo" | "empty";

export type MIBundle = {
  products: MIProduct[];
  categories: MICategory[];
  shops: MIShop[];
  creators: MICreator[];
  videos: MIVideoAd[];
  lives: MILivestream[];
  sources: MIResearchSource[];
  providers: MIProviderStatus[];
  errors: string[];
  generatedAt: string;
  dataMode?: MIDataMode;
  activeSource?: string;
  isDemo?: boolean;
  rowCount?: number;
};

export type MIQuery = {
  period?: MITrendPeriod;
  country?: string;
  marketplace?: string;
  category?: string;
  q?: string;
  sort?: MISortKey;
};
