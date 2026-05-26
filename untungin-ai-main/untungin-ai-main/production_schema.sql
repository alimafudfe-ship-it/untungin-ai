-- STEP 4: Scale features foundation
-- Multi-user auth, automation settings, AI chat logs, WhatsApp alerts, and subscription ledger.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null default 'Untungin Workspace',
  plan text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  role text not null default 'staff',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  invited_by uuid references auth.users(id) on delete set null,
  email text not null,
  role text not null default 'staff',
  token text not null default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending',
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

create table if not exists public.automation_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  daily_report_enabled boolean not null default true,
  daily_report_time text not null default '08:00',
  whatsapp_alert_enabled boolean not null default false,
  whatsapp_number text,
  low_stock_threshold numeric not null default 5,
  cashflow_alert_threshold numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.ai_chat_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  source text not null default 'rules-engine',
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_alert_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  phone text,
  message text not null,
  status text not null default 'queued',
  provider_response jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  provider text not null default 'midtrans',
  plan text not null default 'monthly',
  status text not null default 'pending',
  amount numeric(12,2),
  provider_subscription_id text,
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_organization_members_user_id on public.organization_members(user_id);
create index if not exists idx_automation_settings_user_id on public.automation_settings(user_id);
create index if not exists idx_ai_chat_logs_user_id_created on public.ai_chat_logs(user_id, created_at desc);
create index if not exists idx_whatsapp_alert_logs_user_id_created on public.whatsapp_alert_logs(user_id, created_at desc);
create index if not exists idx_subscription_events_user_id_created on public.subscription_events(user_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.team_invitations enable row level security;
alter table public.automation_settings enable row level security;
alter table public.ai_chat_logs enable row level security;
alter table public.whatsapp_alert_logs enable row level security;
alter table public.subscription_events enable row level security;

drop policy if exists organizations_owner_all on public.organizations;
create policy organizations_owner_all on public.organizations for all to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists organization_members_own on public.organization_members;
create policy organization_members_own on public.organization_members for select to authenticated using (auth.uid() = user_id or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = auth.uid()));

drop policy if exists team_invitations_owner on public.team_invitations;
create policy team_invitations_owner on public.team_invitations for all to authenticated using (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = auth.uid())) with check (exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = auth.uid()));

drop policy if exists automation_settings_own on public.automation_settings;
create policy automation_settings_own on public.automation_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists ai_chat_logs_own on public.ai_chat_logs;
create policy ai_chat_logs_own on public.ai_chat_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists whatsapp_alert_logs_own on public.whatsapp_alert_logs;
create policy whatsapp_alert_logs_own on public.whatsapp_alert_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists subscription_events_own on public.subscription_events;
create policy subscription_events_own on public.subscription_events for select to authenticated using (auth.uid() = user_id);
