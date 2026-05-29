
create table marketplace_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  marketplace text,
  shop_id text,
  shop_name text,
  access_token text,
  refresh_token text,
  expired_at timestamptz,
  created_at timestamptz default now()
);

create table marketplace_products (
  id uuid primary key default gen_random_uuid(),
  marketplace text,
  external_product_id text,
  sku text,
  name text,
  stock integer,
  price numeric,
  image text,
  created_at timestamptz default now()
);

create table marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  marketplace text,
  external_order_id text,
  buyer_name text,
  total numeric,
  status text,
  raw jsonb,
  created_at timestamptz default now()
);
