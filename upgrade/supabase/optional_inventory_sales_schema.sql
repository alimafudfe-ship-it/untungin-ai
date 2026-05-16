-- Optional production schema for future split tables.
-- The provided page.tsx already works with your current products table.
-- Run this later if you want permanent sales and inventory movement history.

create table if not exists public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjust', 'sale')),
  qty integer not null check (qty >= 0),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty integer not null check (qty > 0),
  selling_price numeric not null default 0,
  cost_price numeric not null default 0,
  other_cost numeric not null default 0,
  revenue numeric not null default 0,
  profit numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.inventory_logs enable row level security;
alter table public.sales enable row level security;

create policy if not exists "inventory_logs_select_own" on public.inventory_logs
for select using (auth.uid() = user_id);

create policy if not exists "inventory_logs_insert_own" on public.inventory_logs
for insert with check (auth.uid() = user_id);

create policy if not exists "sales_select_own" on public.sales
for select using (auth.uid() = user_id);

create policy if not exists "sales_insert_own" on public.sales
for insert with check (auth.uid() = user_id);
