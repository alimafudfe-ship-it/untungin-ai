export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ENTITY_TABLE: Record<string, string> = {
  products: "market_intelligence_products",
  shops: "market_intelligence_shops",
  creators: "market_intelligence_creators",
  videos: "market_intelligence_videos",
  lives: "market_intelligence_livestreams",
  categories: "market_intelligence_categories",
  sources: "market_intelligence_sources",
};

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function readToken(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const header = req.headers.get("x-partner-feed-token") || req.headers.get("x-market-intelligence-token") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : header.trim();
}

function validPartnerToken(req: Request, payload: any) {
  const required = process.env.MARKET_INTELLIGENCE_PARTNER_TOKEN || process.env.MARKET_INTELLIGENCE_ADMIN_TOKEN || "";
  const token = readToken(req) || String(payload?.partner_key || payload?.partnerKey || "").trim();
  return Boolean(required && token && token === required);
}

function text(value: unknown, fallback = "") {
  const output = String(value ?? "").trim();
  return output || fallback;
}

function num(value: unknown, fallback = 0) {
  const output = Number(value);
  return Number.isFinite(output) ? output : fallback;
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(/[|,]/g).map((item) => item.trim()).filter(Boolean);
  return [];
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "item";
}

function baseExternalId(entity: string, item: any) {
  return text(item.external_id || item.externalId || item.id, `${entity}-${slug(text(item.product_name || item.productName || item.shop_name || item.shopName || item.creator_name || item.creatorName || item.title || item.name || item.keyword, "feed-item"))}`);
}

function productRow(item: any, meta: any) {
  return {
    external_id: baseExternalId("product", item),
    product_name: text(item.product_name || item.productName, "Produk partner feed"),
    category: text(item.category, "Uncategorized"),
    subcategory: item.subcategory || null,
    keyword: text(item.keyword || item.product_name || item.productName, ""),
    marketplace: text(item.marketplace || meta.marketplace, "TikTok Shop"),
    country: text(item.country || meta.country, "ID"),
    period: text(item.period || meta.period, "week"),
    price_min: num(item.price_min ?? item.priceMin),
    price_max: num(item.price_max ?? item.priceMax),
    sold_7d: num(item.sold_7d ?? item.sold7d),
    sold_30d: num(item.sold_30d ?? item.sold30d),
    revenue_7d: num(item.revenue_7d ?? item.revenue7d),
    revenue_30d: num(item.revenue_30d ?? item.revenue30d),
    growth_7d: num(item.growth_7d ?? item.growth7d),
    growth_30d: num(item.growth_30d ?? item.growth30d),
    seller_count: num(item.seller_count ?? item.sellerCount),
    creator_count: num(item.creator_count ?? item.creatorCount),
    video_count: num(item.video_count ?? item.videoCount),
    live_count: num(item.live_count ?? item.liveCount),
    ad_count: num(item.ad_count ?? item.adCount),
    avg_rating: num(item.avg_rating ?? item.avgRating),
    review_count: num(item.review_count ?? item.reviewCount),
    demand_score: num(item.demand_score ?? item.demandScore),
    growth_score: num(item.growth_score ?? item.growthScore),
    competition_score: num(item.competition_score ?? item.competitionScore),
    opportunity_score: num(item.opportunity_score ?? item.opportunityScore),
    saturation_score: num(item.saturation_score ?? item.saturationScore),
    margin_signal: num(item.margin_signal ?? item.marginSignal),
    signal: text(item.signal, "rising"),
    source: text(item.source || meta.partner_name || meta.partnerName, "Partner feed"),
    source_kind: "partner_feed",
    source_url: item.source_url || item.sourceUrl || null,
    notes: item.notes || null,
    collected_at: item.collected_at || item.collectedAt || meta.collected_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function shopRow(item: any, meta: any) {
  return {
    external_id: baseExternalId("shop", item),
    shop_name: text(item.shop_name || item.shopName, "Toko partner feed"),
    marketplace: text(item.marketplace || meta.marketplace, "TikTok Shop"),
    country: text(item.country || meta.country, "ID"),
    category_focus: text(item.category_focus || item.categoryFocus || item.category, "General"),
    product_count: num(item.product_count ?? item.productCount),
    sold_30d: num(item.sold_30d ?? item.sold30d),
    revenue_30d: num(item.revenue_30d ?? item.revenue30d),
    avg_price: num(item.avg_price ?? item.avgPrice),
    avg_rating: num(item.avg_rating ?? item.avgRating),
    review_count: num(item.review_count ?? item.reviewCount),
    followers: num(item.followers),
    live_count: num(item.live_count ?? item.liveCount),
    ad_count: num(item.ad_count ?? item.adCount),
    top_product_external_id: item.top_product_external_id || item.topProductId || null,
    opportunity_gap: item.opportunity_gap || item.opportunityGap || null,
    source: text(item.source || meta.partner_name || meta.partnerName, "Partner feed"),
    source_kind: "partner_feed",
    notes: item.notes || null,
    collected_at: item.collected_at || item.collectedAt || meta.collected_at || new Date().toISOString(),
  };
}

function creatorRow(item: any, meta: any) {
  return {
    external_id: baseExternalId("creator", item),
    creator_name: text(item.creator_name || item.creatorName, "Kreator partner feed"),
    handle: text(item.handle, ""),
    marketplace: text(item.marketplace || meta.marketplace, "TikTok Shop"),
    country: text(item.country || meta.country, "ID"),
    category_focus: text(item.category_focus || item.categoryFocus || item.category, "General"),
    followers: num(item.followers),
    avg_views: num(item.avg_views ?? item.avgViews),
    engagement_rate: num(item.engagement_rate ?? item.engagementRate),
    product_count: num(item.product_count ?? item.productCount),
    sold_30d: num(item.sold_30d ?? item.sold30d),
    revenue_30d: num(item.revenue_30d ?? item.revenue30d),
    commission_rate: num(item.commission_rate ?? item.commissionRate),
    fit_score: num(item.fit_score ?? item.fitScore),
    top_product_external_id: item.top_product_external_id || item.topProductId || null,
    source: text(item.source || meta.partner_name || meta.partnerName, "Partner feed"),
    source_kind: "partner_feed",
    notes: item.notes || null,
    collected_at: item.collected_at || item.collectedAt || meta.collected_at || new Date().toISOString(),
  };
}

function videoRow(item: any, meta: any) {
  return {
    external_id: baseExternalId("video", item),
    title: text(item.title, "Video partner feed"),
    format: text(item.format, "organic"),
    product_external_id: item.product_external_id || item.productId || null,
    creator_external_id: item.creator_external_id || item.creatorId || null,
    marketplace: text(item.marketplace || meta.marketplace, "TikTok Shop"),
    country: text(item.country || meta.country, "ID"),
    views: num(item.views),
    likes: num(item.likes),
    comments: num(item.comments),
    shares: num(item.shares),
    ctr: num(item.ctr),
    cvr: num(item.cvr),
    gmv_estimate: num(item.gmv_estimate ?? item.gmvEstimate),
    hook: item.hook || null,
    cta: item.cta || null,
    duration_sec: num(item.duration_sec ?? item.durationSec),
    posted_at: item.posted_at || item.postedAt || new Date().toISOString(),
    source_url: item.source_url || item.sourceUrl || null,
    source: text(item.source || meta.partner_name || meta.partnerName, "Partner feed"),
    source_kind: "partner_feed",
    notes: item.notes || null,
  };
}

function liveRow(item: any, meta: any) {
  return {
    external_id: baseExternalId("live", item),
    title: text(item.title, "Live partner feed"),
    host_name: item.host_name || item.hostName || null,
    host_type: text(item.host_type || item.hostType, "seller"),
    marketplace: text(item.marketplace || meta.marketplace, "TikTok Shop"),
    country: text(item.country || meta.country, "ID"),
    category_focus: text(item.category_focus || item.categoryFocus || item.category, "General"),
    product_external_ids: list(item.product_external_ids || item.productIds),
    viewers_peak: num(item.viewers_peak ?? item.viewersPeak),
    duration_min: num(item.duration_min ?? item.durationMin),
    sold_units: num(item.sold_units ?? item.soldUnits),
    revenue: num(item.revenue),
    conversion_rate: num(item.conversion_rate ?? item.conversionRate),
    live_date: item.live_date || item.liveDate || new Date().toISOString(),
    source_url: item.source_url || item.sourceUrl || null,
    source: text(item.source || meta.partner_name || meta.partnerName, "Partner feed"),
    source_kind: "partner_feed",
    notes: item.notes || null,
  };
}

function categoryRow(item: any, meta: any) {
  return {
    external_id: baseExternalId("category", item),
    name: text(item.name || item.category, "Kategori partner feed"),
    parent: item.parent || null,
    marketplace: text(item.marketplace || meta.marketplace, "All"),
    country: text(item.country || meta.country, "ID"),
    product_count: num(item.product_count ?? item.productCount),
    sold_30d: num(item.sold_30d ?? item.sold30d),
    revenue_30d: num(item.revenue_30d ?? item.revenue30d),
    demand_score: num(item.demand_score ?? item.demandScore),
    growth_score: num(item.growth_score ?? item.growthScore),
    competition_score: num(item.competition_score ?? item.competitionScore),
    opportunity_score: num(item.opportunity_score ?? item.opportunityScore),
    top_keywords: list(item.top_keywords ?? item.topKeywords),
    notes: item.notes || null,
    collected_at: item.collected_at || item.collectedAt || meta.collected_at || new Date().toISOString(),
  };
}

function sourceRow(item: any, meta: any) {
  return {
    external_id: baseExternalId("source", item),
    title: text(item.title || item.keyword || item.source_url || item.sourceUrl, "Partner source"),
    marketplace: text(item.marketplace || meta.marketplace, "TikTok Shop"),
    source_type: text(item.source_type || item.sourceType, "search"),
    source_url: text(item.source_url || item.sourceUrl, "https://example.com"),
    keyword: item.keyword || null,
    category: item.category || null,
    country: text(item.country || meta.country, "ID"),
    status: text(item.status, "checked"),
    extracted_count: num(item.extracted_count ?? item.extractedCount),
    created_by: text(item.created_by || item.createdBy || meta.partner_name || meta.partnerName, "Partner feed"),
    notes: item.notes || null,
    updated_at: new Date().toISOString(),
  };
}

function rowFor(entity: string, item: any, meta: any) {
  if (entity === "products") return productRow(item, meta);
  if (entity === "shops") return shopRow(item, meta);
  if (entity === "creators") return creatorRow(item, meta);
  if (entity === "videos") return videoRow(item, meta);
  if (entity === "lives") return liveRow(item, meta);
  if (entity === "categories") return categoryRow(item, meta);
  if (entity === "sources") return sourceRow(item, meta);
  return null;
}

async function logImport(supabase: any, row: Record<string, unknown>) {
  try {
    await supabase.from("market_intelligence_partner_import_logs").insert(row);
  } catch {
    // Optional table. Do not fail feed imports if log migration has not been run yet.
  }
}

export async function GET(_req: Request, ctx: { params: { entity: string } }) {
  const entity = ctx.params.entity;
  if (!ENTITY_TABLE[entity]) return NextResponse.json({ ok: false, error: "Entity tidak valid." }, { status: 404 });
  return NextResponse.json({
    ok: true,
    entity,
    endpoint: `/api/market-intelligence/partner-feed/${entity}`,
    method: "POST",
    auth: "Authorization: Bearer MARKET_INTELLIGENCE_PARTNER_TOKEN atau header x-partner-feed-token",
    acceptedEntities: Object.keys(ENTITY_TABLE),
  });
}

export async function POST(req: Request, ctx: { params: { entity: string } }) {
  const startedAt = Date.now();
  const entity = ctx.params.entity;
  const table = ENTITY_TABLE[entity];
  if (!table) return NextResponse.json({ ok: false, error: "Entity tidak valid. Pakai products, shops, creators, videos, lives, categories, atau sources." }, { status: 404 });

  const supabase = supabaseAdmin();
  if (!supabase) return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY belum lengkap di Vercel." }, { status: 500 });

  let payload: any = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body harus JSON." }, { status: 400 });
  }

  if (!validPartnerToken(req, payload)) {
    return NextResponse.json({ ok: false, error: "Unauthorized partner feed. Isi MARKET_INTELLIGENCE_PARTNER_TOKEN di Vercel dan kirim token yang sama dari partner." }, { status: 401 });
  }

  const items = Array.isArray(payload) ? payload : Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) return NextResponse.json({ ok: false, error: "Payload harus punya items: [...]." }, { status: 400 });

  const rows = items.map((item: any) => rowFor(entity, item, payload)).filter(Boolean) as Record<string, unknown>[];
  const { data, error } = await supabase.from(table).upsert(rows, { onConflict: "external_id" }).select("external_id");
  const durationMs = Date.now() - startedAt;

  await logImport(supabase, {
    partner_name: text(payload.partner_name || payload.partnerName, "Partner feed"),
    entity,
    table_name: table,
    status: error ? "error" : "success",
    received_count: items.length,
    upserted_count: data?.length || 0,
    error_message: error?.message || null,
    duration_ms: durationMs,
    marketplace: payload.marketplace || null,
    country: payload.country || null,
  });

  if (error) return NextResponse.json({ ok: false, error: error.message, received: items.length, durationMs }, { status: 500 });
  return NextResponse.json({ ok: true, entity, table, received: items.length, upserted: data?.length || 0, durationMs });
}
