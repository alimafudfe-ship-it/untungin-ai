-- Untungin.ai v11 Auto Mapping + Import Preview
-- Optional and safe to rerun. App can run without this, but it stores mapping profiles for future override.

create table if not exists public.import_mapping_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  marketplace text not null default 'csv',
  name text not null default 'Default CSV Mapping',
  mapping_json jsonb not null default '{}',
  confidence integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.import_mapping_profiles enable row level security;

drop policy if exists "members CRUD import mapping profiles" on public.import_mapping_profiles;
create policy "members CRUD import mapping profiles"
on public.import_mapping_profiles
for all
using (workspace_id is null or public.is_workspace_member(workspace_id))
with check (workspace_id is null or public.is_workspace_member(workspace_id));

create index if not exists idx_import_mapping_profiles_workspace_marketplace
on public.import_mapping_profiles(workspace_id, marketplace, updated_at desc);

alter table public.import_jobs add column if not exists mapping_confidence integer;
alter table public.import_jobs add column if not exists detected_marketplace text;
alter table public.import_jobs add column if not exists mapping_snapshot jsonb not null default '{}';
