create table if not exists market_intelligence_products (
  id bigint generated always as identity primary key,
  source text,
  product_id text,
  title text,
  keyword text,
  price numeric,
  sold integer,
  rating numeric,
  trend_score numeric,
  opportunity_score numeric,
  movement_score numeric,
  shop_name text,
  thumbnail text,
  created_at timestamptz default now()
);

create index if not exists idx_market_keyword on market_intelligence_products(keyword);
create index if not exists idx_market_title on market_intelligence_products(title);
