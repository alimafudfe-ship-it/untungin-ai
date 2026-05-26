-- Step 5: production integrations, RBAC, onboarding, automation logs

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null default 'Untungin Workspace',
  plan text not null default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner','admin','finance','warehouse','staff','viewer')),
  status text not null default 'active',
  created_at timestamptz default now(),
  unique (organization_id, user_id)
);

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'staff',
  status text not null default 'pending',
  invited_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  payload jsonb default '{}'::jsonb,
  result jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  whatsapp_number text,
  email_report_to text,
  stock_alert_enabled boolean default true,
  daily_report_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.profiles add column if not exists business_type text;
alter table public.profiles add column if not exists main_marketplace text;

alter table public.marketplace_connections add column if not exists shop_name text;
alter table public.marketplace_connections add column if not exists scopes text[] default '{}';
alter table public.marketplace_connections add column if not exists last_sync_at timestamptz;
alter table public.marketplace_connections add column if not exists sync_status text default 'idle';

alter table public.forecast_snapshots add column if not exists confidence numeric default 0.72;
alter table public.forecast_snapshots add column if not exists forecast_points jsonb default '[]'::jsonb;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.team_invitations enable row level security;
alter table public.automation_runs enable row level security;
alter table public.notification_settings enable row level security;

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations for select to authenticated using (
  owner_id = auth.uid() or exists (select 1 from public.organization_members m where m.organization_id = id and m.user_id = auth.uid())
);

drop policy if exists organizations_insert_own on public.organizations;
create policy organizations_insert_own on public.organizations for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists organizations_update_owner on public.organizations;
create policy organizations_update_owner on public.organizations for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists members_select_own_org on public.organization_members;
create policy members_select_own_org on public.organization_members for select to authenticated using (
  user_id = auth.uid() or exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = auth.uid())
);

drop policy if exists members_insert_owner on public.organization_members;
create policy members_insert_owner on public.organization_members for insert to authenticated with check (
  exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = auth.uid())
);

drop policy if exists invites_select_owner on public.team_invitations;
create policy invites_select_owner on public.team_invitations for select to authenticated using (
  exists (select 1 from public.organizations o where o.id = organization_id and o.owner_id = auth.uid()) or email = auth.email()
);

drop policy if exists notification_settings_own on public.notification_settings;
create policy notification_settings_own on public.notification_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists automation_runs_own on public.automation_runs;
create policy automation_runs_own on public.automation_runs for select to authenticated using (user_id = auth.uid());

create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_team_invites_email on public.team_invitations(email);
create index if not exists idx_automation_runs_user_type on public.automation_runs(user_id, type, created_at desc);
create index if not exists idx_marketplace_connections_user_provider on public.marketplace_connections(user_id, provider);
