-- Untungin.ai v7 STARTUP SERIOUS migration
-- Jalankan setelah production_v6_real_data_schema.sql.
-- Fokus: billing multi-provider, AI daily briefing, audit log, dan growth moat.

do $$ begin
  create type public.billing_provider as enum ('xendit','midtrans','manual','other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.checkout_status as enum ('created','pending','paid','failed','expired','cancelled','approved_manual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.briefing_status as enum ('draft','sent','read','archived');
exception when duplicate_object then null;
end $$;

alter table public.subscriptions add column if not exists provider billing_provider default 'xendit';
alter table public.subscriptions add column if not exists provider_customer_id text;
alter table public.subscriptions add column if not exists provider_subscription_id text;
alter table public.subscriptions add column if not exists metadata jsonb not null default '{}';

create table if not exists public.billing_checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  provider billing_provider not null default 'xendit',
  plan subscription_plan not null default 'pro',
  amount numeric(14,2) not null default 0,
  currency text not null default 'IDR',
  status checkout_status not null default 'created',
  external_id text unique,
  checkout_url text,
  proof_url text,
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  approved_at timestamptz
);

create table if not exists public.ai_daily_briefings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  status briefing_status not null default 'draft',
  title text not null,
  summary text not null,
  priority_action text not null,
  risk_flags jsonb not null default '[]',
  metric_snapshot jsonb not null default '{}',
  generated_by text not null default 'rule-engine',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.growth_experiments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  hypothesis text not null,
  metric_name text not null,
  baseline numeric(14,2),
  target numeric(14,2),
  result numeric(14,2),
  status text not null default 'planned',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.billing_checkout_sessions enable row level security;
alter table public.ai_daily_briefings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.growth_experiments enable row level security;

drop policy if exists "members read checkout sessions" on public.billing_checkout_sessions;
drop policy if exists "members create checkout sessions" on public.billing_checkout_sessions;
drop policy if exists "members read daily briefings" on public.ai_daily_briefings;
drop policy if exists "members CRUD daily briefings" on public.ai_daily_briefings;
drop policy if exists "members read audit logs" on public.audit_logs;
drop policy if exists "members CRUD experiments" on public.growth_experiments;

create policy "members read checkout sessions" on public.billing_checkout_sessions for select using (workspace_id is null or public.is_workspace_member(workspace_id));
create policy "members create checkout sessions" on public.billing_checkout_sessions for insert with check (workspace_id is null or public.is_workspace_member(workspace_id));
create policy "members read daily briefings" on public.ai_daily_briefings for select using (public.is_workspace_member(workspace_id));
create policy "members CRUD daily briefings" on public.ai_daily_briefings for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members read audit logs" on public.audit_logs for select using (workspace_id is null or public.is_workspace_member(workspace_id));
create policy "members CRUD experiments" on public.growth_experiments for all using (workspace_id is null or public.is_workspace_member(workspace_id)) with check (workspace_id is null or public.is_workspace_member(workspace_id));

create index if not exists idx_checkout_workspace_status on public.billing_checkout_sessions(workspace_id, status, created_at desc);
create index if not exists idx_briefings_workspace_date on public.ai_daily_briefings(workspace_id, created_at desc);
create index if not exists idx_audit_workspace_date on public.audit_logs(workspace_id, created_at desc);
create index if not exists idx_experiments_workspace_status on public.growth_experiments(workspace_id, status);

do $$ begin
  alter publication supabase_realtime add table public.ai_daily_briefings;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.billing_checkout_sessions;
exception when duplicate_object then null;
end $$;
