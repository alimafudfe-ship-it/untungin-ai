-- Step 3 foundation: AI recommendations, marketplace sync, and forecasts.
-- Safe to run multiple times.

create table if not exists public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  action text,
  severity text default 'info',
  payload jsonb default '{}'::jsonb,
  status text default 'open',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.marketplace_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text default 'not_connected',
  account_name text,
  last_sync_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

create table if not exists public.forecast_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  forecast_revenue numeric(14,2) default 0,
  forecast_profit numeric(14,2) default 0,
  forecast_expenses numeric(14,2) default 0,
  forecast_net_cash numeric(14,2) default 0,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.ai_recommendations enable row level security;
alter table public.marketplace_connections enable row level security;
alter table public.forecast_snapshots enable row level security;

drop policy if exists "ai_recommendations_select_own" on public.ai_recommendations;
create policy "ai_recommendations_select_own" on public.ai_recommendations for select to authenticated using (auth.uid() = user_id);
drop policy if exists "ai_recommendations_insert_own" on public.ai_recommendations;
create policy "ai_recommendations_insert_own" on public.ai_recommendations for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "ai_recommendations_update_own" on public.ai_recommendations;
create policy "ai_recommendations_update_own" on public.ai_recommendations for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "marketplace_connections_select_own" on public.marketplace_connections;
create policy "marketplace_connections_select_own" on public.marketplace_connections for select to authenticated using (auth.uid() = user_id);
drop policy if exists "marketplace_connections_upsert_own" on public.marketplace_connections;
create policy "marketplace_connections_upsert_own" on public.marketplace_connections for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "marketplace_connections_update_own" on public.marketplace_connections;
create policy "marketplace_connections_update_own" on public.marketplace_connections for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "forecast_snapshots_select_own" on public.forecast_snapshots;
create policy "forecast_snapshots_select_own" on public.forecast_snapshots for select to authenticated using (auth.uid() = user_id);
drop policy if exists "forecast_snapshots_insert_own" on public.forecast_snapshots;
create policy "forecast_snapshots_insert_own" on public.forecast_snapshots for insert to authenticated with check (auth.uid() = user_id);

create index if not exists ai_recommendations_user_created_idx on public.ai_recommendations(user_id, created_at desc);
create index if not exists marketplace_connections_user_provider_idx on public.marketplace_connections(user_id, provider);
create index if not exists forecast_snapshots_user_period_idx on public.forecast_snapshots(user_id, period_start, period_end);
