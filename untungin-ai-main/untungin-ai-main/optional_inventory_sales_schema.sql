-- Untungin.ai Step 2 No.1 - Expense Engine
-- Run in Supabase SQL Editor. Safe to run multiple times.

create extension if not exists pgcrypto;

alter table if exists products add column if not exists marketplace text default 'Manual';

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'Lainnya',
  amount numeric(14,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  product_id uuid null references products(id) on delete set null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on expenses(user_id, expense_date desc);
create index if not exists expenses_user_category_idx on expenses(user_id, category);
create index if not exists expenses_product_idx on expenses(product_id);

alter table expenses enable row level security;

drop policy if exists "Users can view own expenses" on expenses;
create policy "Users can view own expenses" on expenses
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own expenses" on expenses;
create policy "Users can insert own expenses" on expenses
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own expenses" on expenses;
create policy "Users can update own expenses" on expenses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own expenses" on expenses;
create policy "Users can delete own expenses" on expenses
  for delete using (auth.uid() = user_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists expenses_set_updated_at on expenses;
create trigger expenses_set_updated_at
before update on expenses
for each row execute function set_updated_at();
