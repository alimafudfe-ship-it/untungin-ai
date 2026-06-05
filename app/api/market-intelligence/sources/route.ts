export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MARKETPLACES = ["Shopee", "TikTok Shop", "Tokopedia", "Lazada", "Manual", "Public Feed"];
const SOURCE_TYPES = ["search", "product", "shop", "category", "creator", "video", "live", "keyword", "other"];
const STATUSES = ["draft", "queued", "active", "checked", "failed", "archived"];

function supabaseRead() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

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

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function validUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "source";
}

function mapRow(row: any) {
  return {
    id: String(row.external_id || row.id),
    title: row.title || row.keyword || row.source_url || "Source marketplace",
    marketplace: row.marketplace || "TikTok Shop",
    sourceType: row.source_type || "search",
    sourceUrl: row.source_url || "",
    keyword: row.keyword || "",
    category: row.category || "",
    country: row.country || "ID",
    status: row.status || "queued",
    lastCheckedAt: row.last_checked_at || undefined,
    nextCheckAt: row.next_check_at || undefined,
    extractedCount: Number(row.extracted_count || 0),
    createdBy: row.created_by || "",
    notes: row.notes || "",
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  const supabase = supabaseRead();
  if (!supabase) {
    return NextResponse.json({ ok: false, sources: [], error: "Supabase ENV belum lengkap." }, { status: 500 });
  }

  const url = new URL(req.url);
  const marketplace = url.searchParams.get("marketplace") || "All";
  const q = (url.searchParams.get("q") || "").trim();

  let query = supabase.from("market_intelligence_sources").select("*").order("created_at", { ascending: false }).limit(300);
  if (marketplace && marketplace !== "All") query = query.eq("marketplace", marketplace);
  if (q) query = query.or(`title.ilike.%${q}%,keyword.ilike.%${q}%,category.ilike.%${q}%,source_url.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, sources: [], error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, sources: (data || []).map(mapRow), count: data?.length || 0 });
}

export async function POST(req: Request) {
  if (!validAdminToken(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized. Isi MARKET_INTELLIGENCE_ADMIN_TOKEN di Vercel, lalu masukkan token yang sama di form Import/Admin." }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "SUPABASE_SERVICE_ROLE_KEY belum diisi. Service role hanya dipakai server-side untuk menyimpan source link." }, { status: 500 });
  }

  const payload = await req.json();
  const marketplace = cleanText(payload.marketplace, "TikTok Shop");
  const sourceType = cleanText(payload.sourceType || payload.source_type, "search");
  const sourceUrl = cleanText(payload.sourceUrl || payload.source_url);
  const keyword = cleanText(payload.keyword);
  const category = cleanText(payload.category);
  const title = cleanText(payload.title, keyword || `${marketplace} ${sourceType}`);
  const country = cleanText(payload.country, "ID");
  const status = cleanText(payload.status, "queued");
  const notes = cleanText(payload.notes);

  if (!MARKETPLACES.includes(marketplace)) return NextResponse.json({ ok: false, error: "Marketplace tidak valid." }, { status: 400 });
  if (!SOURCE_TYPES.includes(sourceType)) return NextResponse.json({ ok: false, error: "Jenis link tidak valid." }, { status: 400 });
  if (!STATUSES.includes(status)) return NextResponse.json({ ok: false, error: "Status tidak valid." }, { status: 400 });
  if (!validUrl(sourceUrl)) return NextResponse.json({ ok: false, error: "URL marketplace tidak valid. Pakai link http/https." }, { status: 400 });

  const parsed = new URL(sourceUrl);
  const externalId = cleanText(payload.externalId || payload.external_id, `src-${slug(marketplace)}-${slug(sourceType)}-${slug(keyword || title)}-${slug(parsed.hostname)}`);

  const row = {
    external_id: externalId,
    title,
    marketplace,
    source_type: sourceType,
    source_url: sourceUrl,
    keyword: keyword || null,
    category: category || null,
    country,
    status,
    notes: notes || null,
    created_by: cleanText(payload.createdBy || payload.created_by, "Untungin admin"),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("market_intelligence_sources").upsert(row, { onConflict: "external_id" }).select("*").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, source: mapRow(data) });
}
