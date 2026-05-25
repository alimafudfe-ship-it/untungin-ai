-- Untungin.ai production-grade Supabase schema
-- Jalankan bertahap di Supabase SQL Editor. Sesuaikan jika tabel lama sudah ada.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'user' check (role in ('user','admin','owner','staff')),
  plan text not null default 'free' check (plan in ('free','pro')),
  pro_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  marketplace text not null check (marketplace in ('Shopee','Tokopedia','TikTok Shop','Lazada','Manual')),
  store_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  marketplace text default 'Manual',
  sku text,
  name text not null,
  cost_price numeric(14,2) not null default 0,
  selling_price numeric(14,2) not null default 0,
  quantity_sold integer not null default 0,
  stock_initial integer not null default 0,
  stock_remaining integer not null default 0,
  other_cost numeric(14,2) not null default 0,
  profit numeric(14,2) not null default 0,
  margin numeric(8,2) not null default 0,
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  marketplace text default 'Manual',
  order_ref text,
  qty integer not null check (qty > 0),
  gross_revenue numeric(14,2) not null default 0,
  marketplace_fee numeric(14,2) not null default 0,
  ads_cost numeric(14,2) not null default 0,
  packing_cost numeric(14,2) not null default 0,
  net_profit numeric(14,2) not null default 0,
  sold_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  category text not null default 'Ops',
  amount numeric(14,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('in','out','adjust','sale','return')),
  qty integer not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  marketplace text,
  file_name text,
  status text not null default 'processing' check (status in ('processing','completed','failed')),
  rows_total integer default 0,
  rows_success integer default 0,
  rows_failed integer default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  metric text not null check (metric in ('profit','revenue','units','cashflow')),
  target_amount numeric(14,2) not null default 0,
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text,
  answer text not null,
  risk_score integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_user_created on public.products(user_id, created_at desc);
create index if not exists idx_sales_user_sold on public.sales(user_id, sold_at desc);
create index if not exists idx_expenses_user_date on public.expenses(user_id, expense_date desc);
create index if not exists idx_stock_movements_user_product on public.stock_movements(user_id, product_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.marketplace_accounts enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.expenses enable row level security;
alter table public.stock_movements enable row level security;
alter table public.import_jobs enable row level security;
alter table public.goals enable row level security;
alter table public.ai_insights enable row level security;

create policy "profiles own rows" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "marketplace own rows" on public.marketplace_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "products own rows" on public.products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sales own rows" on public.sales for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "expenses own rows" on public.expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "stock own rows" on public.stock_movements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "imports own rows" on public.import_jobs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals own rows" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "insights own rows" on public.ai_insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
