-- Untungin.ai v6 REAL DATA VERSION
-- Jalankan di Supabase SQL Editor setelah membuat project Supabase.
-- Fokus: auth production, workspace, multi-store, CSV import, AI insight, realtime, team access, billing.

create extension if not exists pgcrypto;

create type public.member_role as enum ('owner','admin','finance','operator','analyst','viewer');
-- marketplace dibuat text agar kompatibel dengan data lama seperti "Shopee" atau "TikTok Shop".
create type public.subscription_plan as enum ('free','pro','business');
create type public.insight_severity as enum ('info','success','warning','danger');
create type public.connection_status as enum ('draft','connected','needs_action','expired','disabled');

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Workspace Seller',
  slug text unique,
  plan subscription_plan not null default 'free',
  onboarding_completed boolean not null default false,
  onboarding_step integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role member_role not null default 'viewer',
  invited_by uuid references auth.users(id),
  invite_token text,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(workspace_id, email)
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  marketplace text not null default 'manual',
  external_shop_id text,
  currency text not null default 'IDR',
  timezone text not null default 'Asia/Jakarta',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketplace_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  marketplace text not null,
  status connection_status not null default 'draft',
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] default '{}',
  metadata jsonb not null default '{}',
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  marketplace text default 'manual',
  external_product_id text,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  marketplace text not null default 'csv',
  external_order_id text,
  order_date timestamptz not null default now(),
  status text not null default 'completed',
  buyer_name text,
  gross_revenue numeric(14,2) not null default 0,
  marketplace_fee numeric(14,2) not null default 0,
  ads_cost numeric(14,2) not null default 0,
  voucher_cost numeric(14,2) not null default 0,
  affiliate_cost numeric(14,2) not null default 0,
  cod_cost numeric(14,2) not null default 0,
  net_revenue numeric(14,2) not null default 0,
  source_file text,
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(workspace_id, marketplace, external_order_id)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text,
  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric(14,2) not null default 0,
  cost_price numeric(14,2) not null default 0,
  total_fee numeric(14,2) not null default 0,
  profit numeric(14,2) not null default 0,
  raw jsonb not null default '{}'
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  label text not null,
  title text,
  category text not null default 'Ops',
  amount numeric(14,2) not null default 0,
  expense_date date not null default current_date,
  product_id uuid references public.products(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  severity insight_severity not null default 'info',
  title text not null,
  body text not null,
  action_label text,
  action_payload jsonb not null default '{}',
  metric_snapshot jsonb not null default '{}',
  generated_by text not null default 'rule-engine',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  marketplace text not null default 'csv',
  status text not null default 'queued',
  filename text,
  total_rows integer not null default 0,
  success_rows integer not null default 0,
  failed_rows integer not null default 0,
  errors jsonb not null default '[]',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan subscription_plan not null default 'free',
  status text not null default 'inactive',
  midtrans_order_id text,
  midtrans_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace
    and wm.user_id = auth.uid()
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.stores enable row level security;
alter table public.marketplace_connections enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.expenses enable row level security;
alter table public.ai_insights enable row level security;
alter table public.import_jobs enable row level security;
alter table public.subscriptions enable row level security;

create policy "workspace members read workspaces" on public.workspaces for select using (public.is_workspace_member(id) or owner_id = auth.uid());
create policy "owners create workspaces" on public.workspaces for insert with check (owner_id = auth.uid());
create policy "owners update workspaces" on public.workspaces for update using (owner_id = auth.uid());

create policy "members read members" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "owners manage members" on public.workspace_members for all using (exists(select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid())) with check (exists(select 1 from public.workspaces w where w.id = workspace_id and w.owner_id = auth.uid()));

create policy "members CRUD stores" on public.stores for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members CRUD connections" on public.marketplace_connections for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members CRUD products" on public.products for all using (public.is_workspace_member(workspace_id) or user_id = auth.uid()) with check (public.is_workspace_member(workspace_id) or user_id = auth.uid());
create policy "members CRUD orders" on public.orders for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read order_items" on public.order_items for select using (exists(select 1 from public.orders o where o.id = order_id and public.is_workspace_member(o.workspace_id)));
create policy "members CRUD expenses" on public.expenses for all using (public.is_workspace_member(workspace_id) or user_id = auth.uid()) with check (public.is_workspace_member(workspace_id) or user_id = auth.uid());
create policy "members CRUD insights" on public.ai_insights for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members CRUD import_jobs" on public.import_jobs for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read subscriptions" on public.subscriptions for select using (public.is_workspace_member(workspace_id));

create index if not exists idx_products_workspace on public.products(workspace_id, store_id);
create index if not exists idx_orders_workspace_date on public.orders(workspace_id, order_date desc);
create index if not exists idx_expenses_workspace_date on public.expenses(workspace_id, expense_date desc);
create index if not exists idx_insights_workspace_date on public.ai_insights(workspace_id, created_at desc);

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.ai_insights;
