-- V5 Partner Feed + Import API
-- Jalankan setelah migration V2/V3/V4 selesai.

create table if not exists public.market_intelligence_partners (
  id uuid primary key default gen_random_uuid(),
  partner_name text not null,
  partner_code text not null unique,
  status text not null default 'active' check (status in ('active','paused','disabled')),
  allowed_entities text[] not null default array['products','shops','creators','videos','lives','categories','sources'],
  allowed_marketplaces text[] not null default array['Shopee','TikTok Shop','Tokopedia','Lazada','Manual','Public Feed'],
  contact_name text,
  contact_email text,
  notes text,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_intelligence_partner_import_logs (
  id uuid primary key default gen_random_uuid(),
  partner_name text not null default 'Partner feed',
  entity text not null,
  table_name text not null,
  status text not null default 'success' check (status in ('success','error','partial')),
  received_count integer not null default 0,
  upserted_count integer not null default 0,
  error_message text,
  duration_ms integer not null default 0,
  marketplace text,
  country text default 'ID',
  created_at timestamptz not null default now()
);

create index if not exists idx_market_intelligence_partner_logs_created_at
  on public.market_intelligence_partner_import_logs (created_at desc);

create index if not exists idx_market_intelligence_partner_logs_entity
  on public.market_intelligence_partner_import_logs (entity, status);

insert into public.market_intelligence_partners (partner_name, partner_code, notes)
values ('Default Partner Feed', 'default-partner-feed', 'Partner feed default untuk API V5. Token disimpan di Vercel ENV, bukan di database.')
on conflict (partner_code) do update set updated_at = now();
