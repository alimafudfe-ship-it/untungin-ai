create table if not exists product_snapshots (
  id uuid primary key default gen_random_uuid(),
  marketplace text,
  product_name text,
  sales integer,
  price numeric,
  rating numeric,
  opportunity_score numeric,
  created_at timestamptz default now()
);
