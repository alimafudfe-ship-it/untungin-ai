create table if not exists product_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id text,
  workspace_id text,
  marketplace text,
  product_name text,
  price numeric default 0,
  sales integer default 0,
  revenue numeric default 0,
  competition_score numeric default 0,
  trend_score numeric default 0,
  snapshot_date timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_product_snapshots_product
on product_snapshots(product_id);

create index if not exists idx_product_snapshots_marketplace
on product_snapshots(marketplace);
