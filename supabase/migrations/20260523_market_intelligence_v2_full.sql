-- Untungin.ai V2 Full Market Intelligence
-- Jalankan setelah migration utama. Semua tabel menyimpan data riset marketplace legal/manual/partner feed.

create extension if not exists pgcrypto;

create table if not exists public.market_intelligence_products (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  product_name text not null,
  category text not null,
  subcategory text,
  keyword text not null,
  marketplace text not null default 'TikTok Shop',
  country text not null default 'ID',
  period text not null default 'week',
  price_min numeric(14,2) default 0,
  price_max numeric(14,2) default 0,
  sold_7d integer default 0,
  sold_30d integer default 0,
  revenue_7d numeric(14,2) default 0,
  revenue_30d numeric(14,2) default 0,
  growth_7d numeric(8,2) default 0,
  growth_30d numeric(8,2) default 0,
  seller_count integer default 0,
  creator_count integer default 0,
  video_count integer default 0,
  live_count integer default 0,
  ad_count integer default 0,
  avg_rating numeric(3,2),
  review_count integer default 0,
  demand_score integer default 0 check (demand_score between 0 and 100),
  growth_score integer default 0 check (growth_score between 0 and 100),
  competition_score integer default 0 check (competition_score between 0 and 100),
  opportunity_score integer default 0 check (opportunity_score between 0 and 100),
  saturation_score integer default 0 check (saturation_score between 0 and 100),
  margin_signal integer default 0 check (margin_signal between 0 and 100),
  signal text default 'rising',
  source text default 'Manual research',
  source_kind text default 'manual_upload',
  source_url text,
  notes text,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_intelligence_categories (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  parent text,
  marketplace text default 'All',
  country text default 'ID',
  product_count integer default 0,
  sold_30d integer default 0,
  revenue_30d numeric(14,2) default 0,
  demand_score integer default 0 check (demand_score between 0 and 100),
  growth_score integer default 0 check (growth_score between 0 and 100),
  competition_score integer default 0 check (competition_score between 0 and 100),
  opportunity_score integer default 0 check (opportunity_score between 0 and 100),
  top_keywords text[] default '{}',
  notes text,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.market_intelligence_shops (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  shop_name text not null,
  marketplace text not null,
  country text default 'ID',
  category_focus text,
  product_count integer default 0,
  sold_30d integer default 0,
  revenue_30d numeric(14,2) default 0,
  avg_price numeric(14,2) default 0,
  avg_rating numeric(3,2),
  review_count integer default 0,
  followers integer default 0,
  live_count integer default 0,
  ad_count integer default 0,
  top_product_external_id text,
  opportunity_gap text,
  source text default 'Manual research',
  source_kind text default 'manual_upload',
  notes text,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.market_intelligence_creators (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  creator_name text not null,
  handle text,
  marketplace text not null,
  country text default 'ID',
  category_focus text,
  followers integer default 0,
  avg_views integer default 0,
  engagement_rate numeric(8,2) default 0,
  product_count integer default 0,
  sold_30d integer default 0,
  revenue_30d numeric(14,2) default 0,
  commission_rate numeric(8,2) default 0,
  fit_score integer default 0 check (fit_score between 0 and 100),
  top_product_external_id text,
  source text default 'Manual research',
  source_kind text default 'manual_upload',
  notes text,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.market_intelligence_videos (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  title text not null,
  format text default 'organic',
  product_external_id text,
  creator_external_id text,
  marketplace text not null,
  country text default 'ID',
  views integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  ctr numeric(8,2) default 0,
  cvr numeric(8,2) default 0,
  gmv_estimate numeric(14,2) default 0,
  hook text,
  cta text,
  duration_sec integer default 0,
  posted_at timestamptz,
  source_url text,
  source text default 'Manual research',
  source_kind text default 'manual_upload',
  notes text,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.market_intelligence_livestreams (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  title text not null,
  host_name text,
  host_type text default 'seller',
  marketplace text not null,
  country text default 'ID',
  category_focus text,
  product_external_ids text[] default '{}',
  viewers_peak integer default 0,
  duration_min integer default 0,
  sold_units integer default 0,
  revenue numeric(14,2) default 0,
  conversion_rate numeric(8,2) default 0,
  live_date timestamptz,
  source_url text,
  source text default 'Manual research',
  source_kind text default 'manual_upload',
  notes text,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.market_intelligence_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_name text not null default 'Manual CSV',
  source_kind text not null default 'csv_import',
  file_name text,
  row_count integer default 0,
  status text default 'completed',
  errors jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mi_products_marketplace_idx on public.market_intelligence_products (marketplace);
create index if not exists mi_products_category_idx on public.market_intelligence_products (category);
create index if not exists mi_products_period_idx on public.market_intelligence_products (period);
create index if not exists mi_products_opportunity_idx on public.market_intelligence_products (opportunity_score desc);
create index if not exists mi_shops_marketplace_idx on public.market_intelligence_shops (marketplace);
create index if not exists mi_creators_marketplace_idx on public.market_intelligence_creators (marketplace);
create index if not exists mi_videos_product_idx on public.market_intelligence_videos (product_external_id);
create index if not exists mi_lives_marketplace_idx on public.market_intelligence_livestreams (marketplace);

alter table public.market_intelligence_products enable row level security;
alter table public.market_intelligence_categories enable row level security;
alter table public.market_intelligence_shops enable row level security;
alter table public.market_intelligence_creators enable row level security;
alter table public.market_intelligence_videos enable row level security;
alter table public.market_intelligence_livestreams enable row level security;
alter table public.market_intelligence_import_batches enable row level security;

-- Public read is useful for demo dashboards. Tighten policies if this becomes proprietary data.
do $$ begin
  create policy "market intelligence read" on public.market_intelligence_products for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market intelligence categories read" on public.market_intelligence_categories for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market intelligence shops read" on public.market_intelligence_shops for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market intelligence creators read" on public.market_intelligence_creators for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market intelligence videos read" on public.market_intelligence_videos for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market intelligence lives read" on public.market_intelligence_livestreams for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "market intelligence import batches read" on public.market_intelligence_import_batches for select using (true);
exception when duplicate_object then null; end $$;
