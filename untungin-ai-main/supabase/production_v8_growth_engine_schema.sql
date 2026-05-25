-- Untungin.ai v8 Growth Engine schema
-- Run after production_v6_real_data_schema.sql and production_v7_startup_serious_schema.sql

create table if not exists public.growth_action_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  title text not null,
  owner_role text not null default 'owner',
  urgency text not null default 'monitor',
  impact_area text not null default 'profit',
  detail text,
  success_metric text,
  status text not null default 'open',
  source text not null default 'ai_rule_engine',
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.activation_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  plan_code text not null,
  provider text not null default 'manual',
  status text not null default 'pending',
  amount numeric not null default 0,
  proof_url text,
  admin_notes text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.customer_interviews (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  seller_name text,
  channel text,
  segment text,
  pain_level int check (pain_level between 1 and 10),
  top_pain text,
  willingness_to_pay text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.growth_action_plans enable row level security;
alter table public.activation_events enable row level security;
alter table public.billing_requests enable row level security;
alter table public.customer_interviews enable row level security;

drop policy if exists "workspace members can read growth actions" on public.growth_action_plans;
create policy "workspace members can read growth actions" on public.growth_action_plans
  for select using (exists (select 1 from public.workspace_members wm where wm.workspace_id = growth_action_plans.workspace_id and wm.user_id = auth.uid()));

drop policy if exists "workspace members can manage growth actions" on public.growth_action_plans;
create policy "workspace members can manage growth actions" on public.growth_action_plans
  for all using (exists (select 1 from public.workspace_members wm where wm.workspace_id = growth_action_plans.workspace_id and wm.user_id = auth.uid()))
  with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = growth_action_plans.workspace_id and wm.user_id = auth.uid()));

drop policy if exists "workspace members can read activation" on public.activation_events;
create policy "workspace members can read activation" on public.activation_events
  for select using (exists (select 1 from public.workspace_members wm where wm.workspace_id = activation_events.workspace_id and wm.user_id = auth.uid()));

drop policy if exists "workspace members can insert activation" on public.activation_events;
create policy "workspace members can insert activation" on public.activation_events
  for insert with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = activation_events.workspace_id and wm.user_id = auth.uid()));

drop policy if exists "workspace members can read billing requests" on public.billing_requests;
create policy "workspace members can read billing requests" on public.billing_requests
  for select using (exists (select 1 from public.workspace_members wm where wm.workspace_id = billing_requests.workspace_id and wm.user_id = auth.uid()));

drop policy if exists "workspace members can create billing requests" on public.billing_requests;
create policy "workspace members can create billing requests" on public.billing_requests
  for insert with check (exists (select 1 from public.workspace_members wm where wm.workspace_id = billing_requests.workspace_id and wm.user_id = auth.uid()));

drop policy if exists "workspace members can read interviews" on public.customer_interviews;
create policy "workspace members can read interviews" on public.customer_interviews
  for select using (workspace_id is null or exists (select 1 from public.workspace_members wm where wm.workspace_id = customer_interviews.workspace_id and wm.user_id = auth.uid()));

drop policy if exists "workspace members can create interviews" on public.customer_interviews;
create policy "workspace members can create interviews" on public.customer_interviews
  for insert with check (workspace_id is null or exists (select 1 from public.workspace_members wm where wm.workspace_id = customer_interviews.workspace_id and wm.user_id = auth.uid()));
