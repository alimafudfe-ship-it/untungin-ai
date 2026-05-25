-- Untungin.ai V4 Market Intelligence Source Manager
-- Jalankan di Supabase SQL Editor setelah migration V2/V3.
-- Fungsi: menyimpan link marketplace per sumber riset supaya admin cukup paste link Tokopedia/Shopee/TikTok/Lazada.

create extension if not exists pgcrypto;

create table if not exists public.market_intelligence_sources (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  title text not null,
  marketplace text not null default 'TikTok Shop',
  source_type text not null default 'search', -- search/product/shop/category/creator/video/live/keyword/other
  source_url text not null,
  keyword text,
  category text,
  country text not null default 'ID',
  status text not null default 'queued', -- draft/queued/active/checked/failed/archived
  last_checked_at timestamptz,
  next_check_at timestamptz,
  extracted_count integer not null default 0,
  created_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mi_sources_marketplace_check check (marketplace in ('Shopee','TikTok Shop','Tokopedia','Lazada','Manual','Public Feed')),
  constraint mi_sources_type_check check (source_type in ('search','product','shop','category','creator','video','live','keyword','other')),
  constraint mi_sources_status_check check (status in ('draft','queued','active','checked','failed','archived')),
  constraint mi_sources_url_check check (source_url ~* '^https?://')
);

create index if not exists mi_sources_marketplace_idx on public.market_intelligence_sources (marketplace);
create index if not exists mi_sources_status_idx on public.market_intelligence_sources (status);
create index if not exists mi_sources_type_idx on public.market_intelligence_sources (source_type);
create index if not exists mi_sources_created_idx on public.market_intelligence_sources (created_at desc);
create index if not exists mi_sources_keyword_idx on public.market_intelligence_sources (keyword);

alter table public.market_intelligence_sources enable row level security;

do $$ begin
  create policy "market intelligence sources read" on public.market_intelligence_sources for select using (true);
exception when duplicate_object then null; end $$;

-- Insert/update/delete sebaiknya lewat API server dengan SUPABASE_SERVICE_ROLE_KEY, bukan langsung dari browser.
-- Kalau perlu akses insert client-side, buat policy khusus tenant/user terlebih dahulu.

insert into public.market_intelligence_sources (
  external_id, title, marketplace, source_type, source_url, keyword, category, country, status, created_by, notes
) values
  (
    'src-tokopedia-powerbank-search',
    'Tokopedia search powerbank fast charging',
    'Tokopedia',
    'search',
    'https://www.tokopedia.com/search?st=product&q=powerbank%20fast%20charging',
    'powerbank fast charging',
    'Elektronik',
    'ID',
    'queued',
    'V4 seed',
    'Contoh source link Tokopedia untuk antrean riset manual/partner feed.'
  ),
  (
    'src-shopee-parfum-search',
    'Shopee search parfum roll on',
    'Shopee',
    'search',
    'https://shopee.co.id/search?keyword=parfum%20roll%20on',
    'parfum roll on',
    'Beauty',
    'ID',
    'queued',
    'V4 seed',
    'Contoh source link Shopee. Data produk tetap diisi dari riset legal/manual/API partner.'
  ),
  (
    'src-tiktok-parfum-search',
    'TikTok search parfum roll on viral',
    'TikTok Shop',
    'search',
    'https://www.tiktok.com/search?q=parfum%20roll%20on%20viral',
    'parfum roll on viral',
    'Beauty',
    'ID',
    'queued',
    'V4 seed',
    'Contoh source link TikTok untuk daftar riset.'
  ),
  (
    'src-lazada-earphone-search',
    'Lazada search earphone low latency',
    'Lazada',
    'search',
    'https://www.lazada.co.id/catalog/?q=earphone%20low%20latency',
    'earphone low latency',
    'Elektronik',
    'ID',
    'queued',
    'V4 seed',
    'Contoh source link Lazada.'
  )
on conflict (external_id) do update set
  title = excluded.title,
  marketplace = excluded.marketplace,
  source_type = excluded.source_type,
  source_url = excluded.source_url,
  keyword = excluded.keyword,
  category = excluded.category,
  status = excluded.status,
  notes = excluded.notes,
  updated_at = now();
