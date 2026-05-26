-- Step 2 No.2: Real cashflow, analytics, and reports support
-- Safe to run after 20260513_expense_engine.sql.

create table if not exists public.cashflow_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  cash_in numeric(14,2) not null default 0,
  product_profit numeric(14,2) not null default 0,
  cash_out numeric(14,2) not null default 0,
  net_cashflow numeric(14,2) not null default 0,
  inventory_value numeric(14,2) not null default 0,
  risk_score numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cashflow_snapshots enable row level security;

drop policy if exists "cashflow_snapshots_select_own" on public.cashflow_snapshots;
create policy "cashflow_snapshots_select_own"
on public.cashflow_snapshots for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "cashflow_snapshots_insert_own" on public.cashflow_snapshots;
create policy "cashflow_snapshots_insert_own"
on public.cashflow_snapshots for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "cashflow_snapshots_update_own" on public.cashflow_snapshots;
create policy "cashflow_snapshots_update_own"
on public.cashflow_snapshots for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists cashflow_snapshots_user_period_idx
on public.cashflow_snapshots(user_id, period_start, period_end);

create index if not exists expenses_user_date_idx
on public.expenses(user_id, expense_date desc);

create index if not exists expenses_user_category_idx
on public.expenses(user_id, category);

create table if not exists public.generated_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null default 'monthly',
  period_start date,
  period_end date,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.generated_reports enable row level security;

drop policy if exists "generated_reports_select_own" on public.generated_reports;
create policy "generated_reports_select_own"
on public.generated_reports for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "generated_reports_insert_own" on public.generated_reports;
create policy "generated_reports_insert_own"
on public.generated_reports for insert
to authenticated
with check (auth.uid() = user_id);

create index if not exists generated_reports_user_created_idx
on public.generated_reports(user_id, created_at desc);
