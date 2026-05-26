-- Untungin.ai v10 Profit Accuracy Repair
-- Run this only if old v9 import made unit prices too small and margins unrealistic.

create or replace function public.untungin_parse_number_text(input_value text)
returns numeric
language plpgsql
immutable
as $$
declare
  cleaned text;
  last_comma integer := 0;
  last_dot integer := 0;
  fraction text;
begin
  if input_value is null or btrim(input_value) = '' then
    return 0;
  end if;

  cleaned := regexp_replace(input_value, '(Rp|IDR)', '', 'gi');
  cleaned := regexp_replace(cleaned, '[^0-9,\.\-]', '', 'g');
  cleaned := btrim(cleaned);

  if cleaned = '' or cleaned = '-' or cleaned = ',' or cleaned = '.' then
    return 0;
  end if;

  if position(',' in cleaned) > 0 then
    last_comma := length(cleaned) - position(',' in reverse(cleaned)) + 1;
  end if;

  if position('.' in cleaned) > 0 then
    last_dot := length(cleaned) - position('.' in reverse(cleaned)) + 1;
  end if;

  if last_comma > 0 and last_dot > 0 then
    if last_comma > last_dot then
      cleaned := replace(cleaned, '.', '');
      cleaned := replace(cleaned, ',', '.');
    else
      cleaned := replace(cleaned, ',', '');
    end if;
  elsif last_comma > 0 then
    fraction := substring(cleaned from last_comma + 1);
    if length(fraction) = 3 then
      cleaned := replace(cleaned, ',', '');
    else
      cleaned := replace(cleaned, ',', '.');
    end if;
  elsif last_dot > 0 then
    fraction := substring(cleaned from last_dot + 1);
    if length(fraction) = 3 then
      cleaned := replace(cleaned, '.', '');
    end if;
  end if;

  return cleaned::numeric;
exception when others then
  return 0;
end;
$$;

with raw_prices as (
  select
    oi.product_id,
    public.untungin_parse_number_text(coalesce(oi.raw ->> 'Harga Jual', oi.raw ->> 'Harga Satuan', oi.raw ->> 'Unit Price', oi.raw ->> 'Selling Price', oi.raw ->> 'Harga Barang')) as unit_price,
    public.untungin_parse_number_text(coalesce(oi.raw ->> 'HPP', oi.raw ->> 'Harga Modal', oi.raw ->> 'Modal', oi.raw ->> 'Cost Price')) as unit_cost,
    greatest(public.untungin_parse_number_text(coalesce(oi.raw ->> 'Jumlah', oi.raw ->> 'Qty', oi.raw ->> 'Quantity', oi.raw ->> 'Jumlah Produk')), 1) as qty
  from public.order_items oi
  where oi.product_id is not null
), repair as (
  select
    p.id,
    rp.unit_price,
    case when rp.unit_cost > 0 then rp.unit_cost else p.cost_price end as unit_cost,
    case when rp.qty > 0 then rp.qty else greatest(p.quantity_sold, 1) end as qty,
    coalesce(p.other_cost, 0) as other_cost
  from public.products p
  join raw_prices rp on rp.product_id = p.id
  where rp.unit_price > 0
    and (
      p.selling_price < p.cost_price
      or abs(coalesce(p.margin, 0)) > 1000
      or p.selling_price <= round(rp.unit_price / greatest(rp.qty, 1)) + 1
    )
)
update public.products p
set
  selling_price = repair.unit_price,
  cost_price = repair.unit_cost,
  quantity_sold = repair.qty,
  profit = ((repair.unit_price - repair.unit_cost) * repair.qty) - repair.other_cost,
  margin = case when repair.unit_price > 0 then ((repair.unit_price - repair.unit_cost) / repair.unit_price) * 100 else 0 end,
  updated_at = now()
from repair
where p.id = repair.id;

update public.order_items oi
set
  unit_price = p.selling_price,
  cost_price = p.cost_price,
  quantity = p.quantity_sold,
  profit = p.profit
from public.products p
where oi.product_id = p.id;

with order_totals as (
  select
    oi.order_id,
    sum(coalesce(oi.unit_price, 0) * greatest(coalesce(oi.quantity, 1), 1)) as gross_revenue,
    sum(coalesce(oi.total_fee, 0)) as total_fee,
    sum(coalesce(oi.profit, 0)) as profit
  from public.order_items oi
  where oi.order_id is not null
  group by oi.order_id
)
update public.orders o
set
  gross_revenue = ot.gross_revenue,
  net_revenue = ot.gross_revenue - ot.total_fee
from order_totals ot
where o.id = ot.order_id;
