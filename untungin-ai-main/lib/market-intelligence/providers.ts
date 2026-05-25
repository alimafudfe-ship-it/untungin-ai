import { createClient } from "@supabase/supabase-js";
import { MI_SAMPLE_BUNDLE } from "./sampleData";
import { filterBundle } from "./scoring";
import type { MIBundle, MIProviderStatus, MIQuery, MISourceKind } from "./types";

function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(/[|,]/g).map((item) => item.trim()).filter(Boolean);
  return [];
}

function sourceMode() {
  return String(process.env.MARKET_INTELLIGENCE_MODE || "auto").toLowerCase();
}

function isDemoAllowed() {
  const mode = sourceMode();
  if (mode === "supabase" || mode === "feed" || mode === "live") return false;
  const flag = String(process.env.MARKET_INTELLIGENCE_USE_DEMO || "auto").toLowerCase();
  return !["false", "0", "no", "off"].includes(flag);
}

function emptyBundle(errors: string[] = []): MIBundle {
  return {
    products: [],
    categories: [],
    shops: [],
    creators: [],
    videos: [],
    lives: [],
    sources: [],
    providers: [],
    errors,
    generatedAt: new Date().toISOString(),
    dataMode: "empty",
    activeSource: "Belum ada sumber data aktif",
    isDemo: false,
    rowCount: 0,
  };
}

function countRows(bundle: Pick<MIBundle, "products" | "categories" | "shops" | "creators" | "videos" | "lives"> & { sources?: unknown[] }) {
  return bundle.products.length + bundle.categories.length + bundle.shops.length + bundle.creators.length + bundle.videos.length + bundle.lives.length + (bundle.sources?.length || 0);
}

function withMetadata(bundle: MIBundle, dataMode: MIBundle["dataMode"], activeSource: string, isDemo = false): MIBundle {
  return {
    ...bundle,
    dataMode,
    activeSource,
    isDemo,
    rowCount: countRows(bundle),
    generatedAt: new Date().toISOString(),
  };
}

function mergeBundle(base: MIBundle, extra: Partial<MIBundle>, sourceName: string, kind: MISourceKind): MIBundle {
  const stamp = new Date().toISOString();
  const tag = (row: any) => ({ ...row, source: row.source || sourceName, sourceKind: row.sourceKind || row.source_kind || kind, collectedAt: row.collectedAt || row.collected_at || stamp });
  return {
    ...base,
    products: [...base.products, ...toArray(extra.products).map(tag)],
    categories: [...base.categories, ...toArray(extra.categories).map(tag)],
    shops: [...base.shops, ...toArray(extra.shops).map(tag)],
    creators: [...base.creators, ...toArray(extra.creators).map(tag)],
    videos: [...base.videos, ...toArray(extra.videos).map(tag)],
    lives: [...base.lives, ...toArray(extra.lives).map(tag)],
    sources: [...(base.sources || []), ...toArray((extra as any).sources)],
    providers: base.providers,
    generatedAt: stamp,
  };
}

async function readBundleFeed(url: string, sourceName: string, kind: MISourceKind) {
  const response = await fetch(url, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`${sourceName} gagal dibaca: ${response.status}`);
  const payload = await response.json();
  return { payload: payload as Partial<MIBundle>, sourceName, kind };
}

const FEEDS = [
  { env: "MARKET_INTELLIGENCE_FEED_URL", id: "market-intelligence-feed", name: "Partner/manual JSON feed", sourceName: "Market Intelligence Feed", kind: "partner_feed" as MISourceKind },
  { env: "KALODATA_LIKE_FEED_URL", id: "kalodata-like-v2", name: "Kalodata-like JSON feed", sourceName: "Kalodata-like V2 Feed", kind: "manual_upload" as MISourceKind },
];

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return { url, key, enabled: Boolean(url && key) };
}

function supabaseProviderStatus(): MIProviderStatus {
  const config = getSupabaseConfig();
  return {
    id: "supabase-market-intelligence",
    name: "Supabase Market Intelligence DB",
    kind: "official_api",
    enabled: config.enabled,
    status: config.enabled ? "ready" : "config_missing",
    message: config.enabled
      ? "Supabase aktif. Data akan dibaca dari tabel market_intelligence_* sebelum demo fallback."
      : "Isi NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY atau SUPABASE_SERVICE_ROLE_KEY untuk memakai data database, bukan data lokal.",
  };
}

export function getMarketIntelligenceProviders(): MIProviderStatus[] {
  const providers: MIProviderStatus[] = [supabaseProviderStatus()];
  for (const feed of FEEDS) {
    const enabled = Boolean(process.env[feed.env]);
    providers.push({
      id: feed.id,
      name: feed.name,
      kind: feed.kind,
      enabled,
      status: enabled ? "ready" : "config_missing",
      message: enabled ? `${feed.env} aktif.` : `Isi ${feed.env} kalau ingin menambah data dari JSON feed legal.`,
    });
  }
  providers.push({
    id: "demo-local-fallback",
    name: "Demo local fallback",
    kind: "demo_seed",
    enabled: isDemoAllowed(),
    status: isDemoAllowed() ? "demo" : "config_missing",
    message: isDemoAllowed()
      ? "Demo lokal hanya dipakai jika Supabase/feed kosong. Matikan dengan MARKET_INTELLIGENCE_USE_DEMO=false."
      : "Demo lokal dimatikan. Dashboard hanya menampilkan Supabase/feed.",
  });
  return providers;
}

function mapProduct(row: any) {
  const id = String(row.external_id || row.id);
  return {
    id,
    productName: row.product_name || row.productName || "Produk tanpa nama",
    category: row.category || "Uncategorized",
    subcategory: row.subcategory || undefined,
    keyword: row.keyword || row.product_name || "",
    marketplace: row.marketplace || "TikTok Shop",
    country: row.country || "ID",
    period: row.period || "week",
    priceMin: toNumber(row.price_min ?? row.priceMin),
    priceMax: toNumber(row.price_max ?? row.priceMax),
    sold7d: toNumber(row.sold_7d ?? row.sold7d),
    sold30d: toNumber(row.sold_30d ?? row.sold30d),
    revenue7d: toNumber(row.revenue_7d ?? row.revenue7d),
    revenue30d: toNumber(row.revenue_30d ?? row.revenue30d),
    growth7d: toNumber(row.growth_7d ?? row.growth7d),
    growth30d: toNumber(row.growth_30d ?? row.growth30d),
    sellerCount: toNumber(row.seller_count ?? row.sellerCount),
    creatorCount: toNumber(row.creator_count ?? row.creatorCount),
    videoCount: toNumber(row.video_count ?? row.videoCount),
    liveCount: toNumber(row.live_count ?? row.liveCount),
    adCount: toNumber(row.ad_count ?? row.adCount),
    avgRating: toNumber(row.avg_rating ?? row.avgRating),
    reviewCount: toNumber(row.review_count ?? row.reviewCount),
    demandScore: toNumber(row.demand_score ?? row.demandScore),
    growthScore: toNumber(row.growth_score ?? row.growthScore),
    competitionScore: toNumber(row.competition_score ?? row.competitionScore),
    opportunityScore: toNumber(row.opportunity_score ?? row.opportunityScore),
    saturationScore: toNumber(row.saturation_score ?? row.saturationScore),
    marginSignal: toNumber(row.margin_signal ?? row.marginSignal),
    signal: row.signal || "rising",
    source: row.source || "Supabase DB",
    sourceKind: row.source_kind || row.sourceKind || "manual_upload",
    sourceUrl: row.source_url || row.sourceUrl || undefined,
    collectedAt: row.collected_at || row.collectedAt || row.updated_at || row.created_at || new Date().toISOString(),
    shopIds: toStringArray(row.shop_ids || row.shopIds),
    creatorIds: toStringArray(row.creator_ids || row.creatorIds),
    videoIds: toStringArray(row.video_ids || row.videoIds),
    liveIds: toStringArray(row.live_ids || row.liveIds),
    notes: row.notes || undefined,
  };
}

function mapCategory(row: any) {
  return {
    id: String(row.external_id || row.id),
    name: row.name || "Kategori tanpa nama",
    parent: row.parent || undefined,
    marketplace: row.marketplace || "All",
    country: row.country || "ID",
    productCount: toNumber(row.product_count ?? row.productCount),
    sold30d: toNumber(row.sold_30d ?? row.sold30d),
    revenue30d: toNumber(row.revenue_30d ?? row.revenue30d),
    demandScore: toNumber(row.demand_score ?? row.demandScore),
    growthScore: toNumber(row.growth_score ?? row.growthScore),
    competitionScore: toNumber(row.competition_score ?? row.competitionScore),
    opportunityScore: toNumber(row.opportunity_score ?? row.opportunityScore),
    topKeywords: toStringArray(row.top_keywords ?? row.topKeywords),
    notes: row.notes || undefined,
  };
}

function mapShop(row: any) {
  return {
    id: String(row.external_id || row.id),
    shopName: row.shop_name || row.shopName || "Toko tanpa nama",
    marketplace: row.marketplace || "TikTok Shop",
    country: row.country || "ID",
    categoryFocus: row.category_focus || row.categoryFocus || "General",
    productCount: toNumber(row.product_count ?? row.productCount),
    sold30d: toNumber(row.sold_30d ?? row.sold30d),
    revenue30d: toNumber(row.revenue_30d ?? row.revenue30d),
    avgPrice: toNumber(row.avg_price ?? row.avgPrice),
    avgRating: toNumber(row.avg_rating ?? row.avgRating),
    reviewCount: toNumber(row.review_count ?? row.reviewCount),
    followers: toNumber(row.followers),
    liveCount: toNumber(row.live_count ?? row.liveCount),
    adCount: toNumber(row.ad_count ?? row.adCount),
    topProductId: row.top_product_external_id || row.topProductId || undefined,
    opportunityGap: row.opportunity_gap || row.opportunityGap || "",
    source: row.source || "Supabase DB",
    sourceKind: row.source_kind || row.sourceKind || "manual_upload",
    collectedAt: row.collected_at || row.collectedAt || row.created_at || new Date().toISOString(),
    notes: row.notes || undefined,
  };
}

function mapCreator(row: any) {
  return {
    id: String(row.external_id || row.id),
    creatorName: row.creator_name || row.creatorName || "Kreator tanpa nama",
    handle: row.handle || "-",
    marketplace: row.marketplace || "TikTok Shop",
    country: row.country || "ID",
    categoryFocus: row.category_focus || row.categoryFocus || "General",
    followers: toNumber(row.followers),
    avgViews: toNumber(row.avg_views ?? row.avgViews),
    engagementRate: toNumber(row.engagement_rate ?? row.engagementRate),
    productCount: toNumber(row.product_count ?? row.productCount),
    sold30d: toNumber(row.sold_30d ?? row.sold30d),
    revenue30d: toNumber(row.revenue_30d ?? row.revenue30d),
    commissionRate: toNumber(row.commission_rate ?? row.commissionRate),
    fitScore: toNumber(row.fit_score ?? row.fitScore),
    topProductId: row.top_product_external_id || row.topProductId || undefined,
    source: row.source || "Supabase DB",
    sourceKind: row.source_kind || row.sourceKind || "manual_upload",
    collectedAt: row.collected_at || row.collectedAt || row.created_at || new Date().toISOString(),
    notes: row.notes || undefined,
  };
}

function mapVideo(row: any) {
  return {
    id: String(row.external_id || row.id),
    title: row.title || "Video tanpa judul",
    format: row.format || "organic",
    productId: row.product_external_id || row.productId || "",
    creatorId: row.creator_external_id || row.creatorId || undefined,
    marketplace: row.marketplace || "TikTok Shop",
    country: row.country || "ID",
    views: toNumber(row.views),
    likes: toNumber(row.likes),
    comments: toNumber(row.comments),
    shares: toNumber(row.shares),
    ctr: toNumber(row.ctr),
    cvr: toNumber(row.cvr),
    gmvEstimate: toNumber(row.gmv_estimate ?? row.gmvEstimate),
    hook: row.hook || "",
    cta: row.cta || "",
    durationSec: toNumber(row.duration_sec ?? row.durationSec),
    postedAt: row.posted_at || row.postedAt || row.created_at || new Date().toISOString(),
    sourceUrl: row.source_url || row.sourceUrl || undefined,
    source: row.source || "Supabase DB",
    sourceKind: row.source_kind || row.sourceKind || "manual_upload",
    notes: row.notes || undefined,
  };
}

function mapLive(row: any) {
  return {
    id: String(row.external_id || row.id),
    title: row.title || "Live tanpa judul",
    hostName: row.host_name || row.hostName || "-",
    hostType: row.host_type || row.hostType || "seller",
    marketplace: row.marketplace || "TikTok Shop",
    country: row.country || "ID",
    categoryFocus: row.category_focus || row.categoryFocus || "General",
    productIds: toStringArray(row.product_external_ids || row.productIds),
    viewersPeak: toNumber(row.viewers_peak ?? row.viewersPeak),
    durationMin: toNumber(row.duration_min ?? row.durationMin),
    soldUnits: toNumber(row.sold_units ?? row.soldUnits),
    revenue: toNumber(row.revenue),
    conversionRate: toNumber(row.conversion_rate ?? row.conversionRate),
    liveDate: row.live_date || row.liveDate || row.created_at || new Date().toISOString(),
    sourceUrl: row.source_url || row.sourceUrl || undefined,
    source: row.source || "Supabase DB",
    sourceKind: row.source_kind || row.sourceKind || "manual_upload",
    notes: row.notes || undefined,
  };
}

function mapSource(row: any) {
  return {
    id: String(row.external_id || row.id),
    title: row.title || row.keyword || row.source_url || "Source marketplace",
    marketplace: row.marketplace || "TikTok Shop",
    sourceType: row.source_type || row.sourceType || "search",
    sourceUrl: row.source_url || row.sourceUrl || "",
    keyword: row.keyword || undefined,
    category: row.category || undefined,
    country: row.country || "ID",
    status: row.status || "queued",
    lastCheckedAt: row.last_checked_at || row.lastCheckedAt || undefined,
    nextCheckAt: row.next_check_at || row.nextCheckAt || undefined,
    extractedCount: toNumber(row.extracted_count ?? row.extractedCount),
    createdBy: row.created_by || row.createdBy || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || row.created_at || new Date().toISOString(),
  };
}

async function readSupabaseBundle(errors: string[]): Promise<MIBundle> {
  const config = getSupabaseConfig();
  if (!config.enabled) return emptyBundle(errors);

  const supabase = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [products, categories, shops, creators, videos, lives, sources] = await Promise.all([
    supabase.from("market_intelligence_products").select("*").order("opportunity_score", { ascending: false }).limit(500),
    supabase.from("market_intelligence_categories").select("*").order("opportunity_score", { ascending: false }).limit(300),
    supabase.from("market_intelligence_shops").select("*").order("revenue_30d", { ascending: false }).limit(300),
    supabase.from("market_intelligence_creators").select("*").order("fit_score", { ascending: false }).limit(300),
    supabase.from("market_intelligence_videos").select("*").order("views", { ascending: false }).limit(500),
    supabase.from("market_intelligence_livestreams").select("*").order("live_date", { ascending: false, nullsFirst: false }).limit(300),
    supabase.from("market_intelligence_sources").select("*").order("created_at", { ascending: false }).limit(300),
  ]);

  for (const result of [products, categories, shops, creators, videos, lives, sources]) {
    if (result.error) errors.push(`Supabase: ${result.error.message}`);
  }

  return {
    products: toArray(products.data).map(mapProduct),
    categories: toArray(categories.data).map(mapCategory),
    shops: toArray(shops.data).map(mapShop),
    creators: toArray(creators.data).map(mapCreator),
    videos: toArray(videos.data).map(mapVideo),
    lives: toArray(lives.data).map(mapLive),
    sources: sources.error ? [] : toArray(sources.data).map(mapSource),
    providers: getMarketIntelligenceProviders(),
    errors,
    generatedAt: new Date().toISOString(),
    dataMode: "supabase",
    activeSource: "Supabase Market Intelligence DB",
    isDemo: false,
    rowCount: 0,
  };
}

export async function collectMarketIntelligence(query: MIQuery = {}) {
  const errors: string[] = [];
  const mode = sourceMode();
  let bundle = emptyBundle(errors);
  bundle.providers = getMarketIntelligenceProviders();

  if (mode !== "feed" && mode !== "demo") {
    try {
      const supabaseBundle = await readSupabaseBundle(errors);
      if (countRows(supabaseBundle) > 0) {
        bundle = withMetadata(supabaseBundle, "supabase", "Supabase Market Intelligence DB", false);
      } else if (getSupabaseConfig().enabled && (mode === "supabase" || mode === "live")) {
        errors.push("Supabase aktif, tetapi tabel market_intelligence_* masih kosong.");
      }
    } catch (error) {
      errors.push(error instanceof Error ? `Supabase gagal dibaca: ${error.message}` : "Supabase gagal dibaca.");
    }
  }

  if (mode !== "supabase" && mode !== "demo" && mode !== "live") {
    for (const feed of FEEDS) {
      const url = process.env[feed.env];
      if (!url) continue;
      try {
        const result = await readBundleFeed(url, feed.sourceName, feed.kind);
        bundle = mergeBundle(bundle, result.payload, result.sourceName, result.kind);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `${feed.env} gagal dibaca.`);
      }
    }
    if (countRows(bundle) > 0 && bundle.dataMode !== "supabase") {
      bundle = withMetadata(bundle, "feed", "JSON feed legal/partner", false);
    } else if (countRows(bundle) > 0) {
      bundle = withMetadata(bundle, "mixed", "Supabase + JSON feed", false);
    }
  }

  if (countRows(bundle) === 0 && isDemoAllowed()) {
    bundle = withMetadata({
      ...MI_SAMPLE_BUNDLE,
      products: [...MI_SAMPLE_BUNDLE.products],
      categories: [...MI_SAMPLE_BUNDLE.categories],
      shops: [...MI_SAMPLE_BUNDLE.shops],
      creators: [...MI_SAMPLE_BUNDLE.creators],
      videos: [...MI_SAMPLE_BUNDLE.videos],
      lives: [...MI_SAMPLE_BUNDLE.lives],
      sources: [...MI_SAMPLE_BUNDLE.sources],
      providers: getMarketIntelligenceProviders(),
      errors,
      generatedAt: new Date().toISOString(),
    }, "demo", "Demo local fallback", true);
  }

  const filtered = filterBundle(bundle, query);
  return {
    ...filtered,
    errors,
    providers: getMarketIntelligenceProviders(),
    generatedAt: new Date().toISOString(),
    dataMode: bundle.dataMode,
    activeSource: bundle.activeSource,
    isDemo: bundle.isDemo,
    rowCount: countRows(filtered),
  };
}
