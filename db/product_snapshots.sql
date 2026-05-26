
create table if not exists product_snapshots(
 id uuid primary key default gen_random_uuid(),
 marketplace text not null,
 keyword text,
 product_id text,
 title text,
 price numeric,
 sales integer,
 rating numeric,
 captured_at timestamptz default now()
);
create index if not exists idx_snapshots_time on product_snapshots(captured_at desc);
