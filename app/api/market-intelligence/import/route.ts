export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { MIBundle } from "@/lib/market-intelligence/types";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function validAdminToken(req: Request) {
  const required = process.env.MARKET_INTELLIGENCE_ADMIN_TOKEN;
  if (!required) return false;
  const auth = req.headers.get("authorization") || "";
  const headerToken = req.headers.get("x-market-intelligence-token") || "";
  return auth === `Bearer ${required}` || headerToken === required;
}

function nonEmpty(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function num(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function arr(value: unknown) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(/[|,]/g).map((item) => item.trim()).filter(Boolean);
  return [];
}

function productRow(item: any) {
  const externalId = nonEmpty(item.external_id || item.externalId || item.id || item.productName || item.product_name);
  return {
    external_id: externalId,
    product_name: nonEmpty(item.product_name || item.productName, "Produk tanpa nama"),
    category: nonEmpty(item.category, "Uncategorized"),
    subcategory: item.subcategory || null,
    keyword: nonEmpty(item.keyword || item.productName || item.product_name),
    marketplace: nonEmpty(item.marketplace, "TikTok Shop"),
    country: nonEmpty(item.country, "ID"),
    period: nonEmpty(item.period, "week"),
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
    signal: nonEmpty(item.signal, "rising"),
    source: nonEmpty(item.source, "Manual import"),
    source_kind: nonEmpty(item.source_kind || item.sourceKind, "csv_import"),
    source_url: item.source_url || item.sourceUrl || null,
    notes: item.notes || null,
    collected_at: item.collected_at || item.collectedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function categoryRow(item: any) {
  return {
    external_id: nonEmpty(item.external_id || item.externalId || item.id || item.name),
    name: nonEmpty(item.name, "Kategori tanpa nama"),
    parent: item.parent || null,
    marketplace: nonEmpty(item.marketplace, "All"),
    country: nonEmpty(item.country, "ID"),
    product_count: num(item.product_count ?? item.productCount),
    sold_30d: num(item.sold_30d ?? item.sold30d),
    revenue_30d: num(item.revenue_30d ?? item.revenue30d),
    demand_score: num(item.demand_score ?? item.demandScore),
    growth_score: num(item.growth_score ?? item.growthScore),
    competition_score: num(item.competition_score ?? item.competitionScore),
    opportunity_score: num(item.opportunity_score ?? item.opportunityScore),
    top_keywords: arr(item.top_keywords ?? item.topKeywords),
    notes: item.notes || null,
    collected_at: item.collected_at || item.collectedAt || new Date().toISOString(),
  };
}

function shopRow(item: any) {
  return {
    external_id: nonEmpty(item.external_id || item.externalId || item.id || item.shopName || item.shop_name),
    shop_name: nonEmpty(item.shop_name || item.shopName, "Toko tanpa nama"),
    marketplace: nonEmpty(item.marketplace, "TikTok Shop"),
    country: nonEmpty(item.country, "ID"),
    category_focus: nonEmpty(item.category_focus || item.categoryFocus, "General"),
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
    source: nonEmpty(item.source, "Manual import"),
    source_kind: nonEmpty(item.source_kind || item.sourceKind, "csv_import"),
    notes: item.notes || null,
    collected_at: item.collected_at || item.collectedAt || new Date().toISOString(),
  };
}

function creatorRow(item: any) {
  return {
    external_id: nonEmpty(item.external_id || item.externalId || item.id || item.handle || item.creatorName || item.creator_name),
    creator_name: nonEmpty(item.creator_name || item.creatorName, "Kreator tanpa nama"),
    handle: item.handle || null,
    marketplace: nonEmpty(item.marketplace, "TikTok Shop"),
    country: nonEmpty(item.country, "ID"),
    category_focus: nonEmpty(item.category_focus || item.categoryFocus, "General"),
    followers: num(item.followers),
    avg_views: num(item.avg_views ?? item.avgViews),
    engagement_rate: num(item.engagement_rate ?? item.engagementRate),
    product_count: num(item.product_count ?? item.productCount),
    sold_30d: num(item.sold_30d ?? item.sold30d),
    revenue_30d: num(item.revenue_30d ?? item.revenue30d),
    commission_rate: num(item.commission_rate ?? item.commissionRate),
    fit_score: num(item.fit_score ?? item.fitScore),
    top_product_external_id: item.top_product_external_id || item.topProductId || null,
    source: nonEmpty(item.source, "Manual import"),
    source_kind: nonEmpty(item.source_kind || item.sourceKind, "csv_import"),
    notes: item.notes || null,
    collected_at: item.collected_at || item.collectedAt || new Date().toISOString(),
  };
}

function videoRow(item: any) {
  return {
    external_id: nonEmpty(item.external_id || item.externalId || item.id || item.title),
    title: nonEmpty(item.title, "Video tanpa judul"),
    format: nonEmpty(item.format, "organic"),
    product_external_id: item.product_external_id || item.productId || null,
    creator_external_id: item.creator_external_id || item.creatorId || null,
    marketplace: nonEmpty(item.marketplace, "TikTok Shop"),
    country: nonEmpty(item.country, "ID"),
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
    source: nonEmpty(item.source, "Manual import"),
    source_kind: nonEmpty(item.source_kind || item.sourceKind, "csv_import"),
    notes: item.notes || null,
  };
}

function liveRow(item: any) {
  return {
    external_id: nonEmpty(item.external_id || item.externalId || item.id || item.title),
    title: nonEmpty(item.title, "Live tanpa judul"),
    host_name: item.host_name || item.hostName || null,
    host_type: nonEmpty(item.host_type || item.hostType, "seller"),
    marketplace: nonEmpty(item.marketplace, "TikTok Shop"),
    country: nonEmpty(item.country, "ID"),
    category_focus: nonEmpty(item.category_focus || item.categoryFocus, "General"),
    product_external_ids: arr(item.product_external_ids || item.productIds),
    viewers_peak: num(item.viewers_peak ?? item.viewersPeak),
    duration_min: num(item.duration_min ?? item.durationMin),
    sold_units: num(item.sold_units ?? item.soldUnits),
    revenue: num(item.revenue),
    conversion_rate: num(item.conversion_rate ?? item.conversionRate),
    live_date: item.live_date || item.liveDate || new Date().toISOString(),
    source_url: item.source_url || item.sourceUrl || null,
    source: nonEmpty(item.source, "Manual import"),
    source_kind: nonEmpty(item.source_kind || item.sourceKind, "csv_import"),
    notes: item.notes || null,
  };
}

async function upsert(supabase: ReturnType<typeof createClient>, table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return { count: 0 };
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "external_id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  return { count: rows.length };
}

export async function POST(req: Request) {
  if (!validAdminToken(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized. Isi MARKET_INTELLIGENCE_ADMIN_TOKEN dan kirim Authorization: Bearer <token>." }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY dan SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL belum lengkap." }, { status: 500 });
  }

  const payload = await req.json() as Partial<MIBundle>;
  const products = Array.isArray(payload.products) ? payload.products.map(productRow) : [];
  const categories = Array.isArray(payload.categories) ? payload.categories.map(categoryRow) : [];
  const shops = Array.isArray(payload.shops) ? payload.shops.map(shopRow) : [];
  const creators = Array.isArray(payload.creators) ? payload.creators.map(creatorRow) : [];
  const videos = Array.isArray(payload.videos) ? payload.videos.map(videoRow) : [];
  const lives = Array.isArray(payload.lives) ? payload.lives.map(liveRow) : [];

  const results = await Promise.all([
    upsert(supabase, "market_intelligence_products", products),
    upsert(supabase, "market_intelligence_categories", categories),
    upsert(supabase, "market_intelligence_shops", shops),
    upsert(supabase, "market_intelligence_creators", creators),
    upsert(supabase, "market_intelligence_videos", videos),
    upsert(supabase, "market_intelligence_livestreams", lives),
  ]);

  const rowCount = results.reduce((sum, item) => sum + item.count, 0);
  await supabase.from("market_intelligence_import_batches").insert({
    source_name: nonEmpty((payload as any).sourceName, "JSON import API"),
    source_kind: nonEmpty((payload as any).sourceKind, "json_import"),
    file_name: (payload as any).fileName || null,
    row_count: rowCount,
    status: "completed",
    errors: [],
  });

  return NextResponse.json({ ok: true, rowCount, products: products.length, categories: categories.length, shops: shops.length, creators: creators.length, videos: videos.length, lives: lives.length });
}
