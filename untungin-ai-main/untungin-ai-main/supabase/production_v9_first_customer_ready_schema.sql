-- Untungin.ai v9 First Customer Ready migration
-- Run after v6, v7, v8. Safe to rerun.

alter table public.workspaces add column if not exists first_import_at timestamptz;
alter table public.workspaces add column if not exists activated_at timestamptz;
alter table public.workspaces add column if not exists activation_score integer not null default 0;

create table if not exists public.onboarding_checklists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  step_key text not null,
  label text not null,
  status text not null default 'pending',
  completed_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(workspace_id, step_key)
);

alter table public.onboarding_checklists enable row level security;

drop policy if exists "members CRUD onboarding checklists" on public.onboarding_checklists;
create policy "members CRUD onboarding checklists" on public.onboarding_checklists
for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create index if not exists idx_onboarding_checklists_workspace on public.onboarding_checklists(workspace_id, status);
create index if not exists idx_activation_events_workspace_name on public.activation_events(workspace_id, event_name, created_at desc);
create index if not exists idx_billing_requests_workspace_status on public.billing_requests(workspace_id, status, created_at desc);

create or replace function public.mark_workspace_first_import(target_workspace uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.workspaces
  set first_import_at = coalesce(first_import_at, now()),
      activated_at = coalesce(activated_at, now()),
      activation_score = greatest(activation_score, 80),
      onboarding_completed = true,
      onboarding_step = greatest(onboarding_step, 4),
      updated_at = now()
  where id = target_workspace;
end;
$$;
