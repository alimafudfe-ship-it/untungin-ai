-- Untungin.ai Market Research Intelligence
-- Kalodata-like product research schema for manual input, CSV import, or legal partner feeds.
-- Do not use this table for private user products; this is market-intelligence data.

create table if not exists public.market_research_products (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  category text,
  keyword text,
  marketplace text not null default 'TikTok Shop',
  country text not null default 'ID',
  period text not null default 'week',
  price_min numeric(14,2) default 0,
  price_max numeric(14,2) default 0,
  sold_7d integer default 0,
  sold_30d integer default 0,
  revenue_7d numeric(14,2) default 0,
  revenue_30d numeric(14,2) default 0,
  monthly_units integer default 0,
  monthly_revenue numeric(14,2) default 0,
  growth_7d numeric(8,2) default 0,
  growth_30d numeric(8,2) default 0,
  seller_count integer default 0,
  creator_count integer default 0,
  video_count integer default 0,
  live_count integer default 0,
  ad_count integer default 0,
  avg_rating numeric(3,2),
  review_count integer default 0,
  demand_score integer default 0,
  growth_score integer default 0,
  competition_score integer default 0,
  opportunity_score integer default 0,
  signal text default 'rising',
  shop_name text,
  top_creator text,
  top_video_views integer default 0,
  top_live_revenue numeric(14,2) default 0,
  source_type text default 'manual',
  source_url text,
  notes text,
  confidence integer default 60,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists market_research_products_marketplace_idx on public.market_research_products (marketplace);
create index if not exists market_research_products_category_idx on public.market_research_products (category);
create index if not exists market_research_products_period_idx on public.market_research_products (period);
create index if not exists market_research_products_score_idx on public.market_research_products (opportunity_score desc, demand_score desc, growth_score desc);
create index if not exists market_research_products_collected_at_idx on public.market_research_products (collected_at desc);

alter table public.market_research_products enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'market_research_products'
      and policyname = 'Authenticated users can read market research products'
  ) then
    create policy "Authenticated users can read market research products"
      on public.market_research_products
      for select
      to authenticated
      using (true);
  end if;
end $$;

create table if not exists public.market_research_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null default 'manual',
  url text,
  status text not null default 'active',
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.market_research_sources enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'market_research_sources'
      and policyname = 'Authenticated users can read market research sources'
  ) then
    create policy "Authenticated users can read market research sources"
      on public.market_research_sources
      for select
      to authenticated
      using (true);
  end if;
end $$;
