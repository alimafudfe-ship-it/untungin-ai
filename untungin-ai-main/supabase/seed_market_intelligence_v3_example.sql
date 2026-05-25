-- Optional starter data for Supabase Market Intelligence V3.
-- Replace these rows with your real/manual research. Once inserted, the app reads this data from Supabase, not from local JSON.

insert into public.market_intelligence_products (
  external_id, product_name, category, keyword, marketplace, country, period,
  price_min, price_max, sold_7d, sold_30d, revenue_7d, revenue_30d,
  growth_7d, growth_30d, seller_count, creator_count, video_count, live_count, ad_count,
  avg_rating, review_count, demand_score, growth_score, competition_score,
  opportunity_score, saturation_score, margin_signal, signal, source, source_kind, notes
) values (
  'manual-parfum-001', 'Parfum roll on viral 10ml', 'Beauty', 'parfum roll on', 'TikTok Shop', 'ID', 'week',
  15000, 49000, 1200, 94000, 48000000, 5200000000,
  24, 68, 180, 240, 850, 72, 34,
  4.7, 12800, 92, 88, 63,
  86, 64, 78, 'viral', 'Manual TikTok Shop research', 'manual_upload', 'Starter seed. Replace with real research.'
) on conflict (external_id) do update set
  product_name = excluded.product_name,
  category = excluded.category,
  keyword = excluded.keyword,
  marketplace = excluded.marketplace,
  country = excluded.country,
  period = excluded.period,
  price_min = excluded.price_min,
  price_max = excluded.price_max,
  sold_7d = excluded.sold_7d,
  sold_30d = excluded.sold_30d,
  revenue_7d = excluded.revenue_7d,
  revenue_30d = excluded.revenue_30d,
  growth_7d = excluded.growth_7d,
  growth_30d = excluded.growth_30d,
  seller_count = excluded.seller_count,
  creator_count = excluded.creator_count,
  video_count = excluded.video_count,
  live_count = excluded.live_count,
  ad_count = excluded.ad_count,
  avg_rating = excluded.avg_rating,
  review_count = excluded.review_count,
  demand_score = excluded.demand_score,
  growth_score = excluded.growth_score,
  competition_score = excluded.competition_score,
  opportunity_score = excluded.opportunity_score,
  saturation_score = excluded.saturation_score,
  margin_signal = excluded.margin_signal,
  signal = excluded.signal,
  source = excluded.source,
  source_kind = excluded.source_kind,
  notes = excluded.notes,
  updated_at = now();

insert into public.market_intelligence_categories (
  external_id, name, marketplace, country, product_count, sold_30d, revenue_30d,
  demand_score, growth_score, competition_score, opportunity_score, top_keywords, notes
) values (
  'cat-beauty-tiktok-id', 'Beauty', 'TikTok Shop', 'ID', 420, 312000, 18600000000,
  90, 84, 68, 79, array['parfum roll on', 'serum wajah', 'lip tint viral'], 'Starter seed. Replace with real research.'
) on conflict (external_id) do update set
  name = excluded.name,
  marketplace = excluded.marketplace,
  country = excluded.country,
  product_count = excluded.product_count,
  sold_30d = excluded.sold_30d,
  revenue_30d = excluded.revenue_30d,
  demand_score = excluded.demand_score,
  growth_score = excluded.growth_score,
  competition_score = excluded.competition_score,
  opportunity_score = excluded.opportunity_score,
  top_keywords = excluded.top_keywords,
  notes = excluded.notes;

insert into public.market_intelligence_shops (
  external_id, shop_name, marketplace, country, category_focus, product_count, sold_30d,
  revenue_30d, avg_price, avg_rating, review_count, followers, live_count, ad_count,
  top_product_external_id, opportunity_gap, source, source_kind, notes
) values (
  'shop-glow-lab-official', 'Glow Lab Official', 'TikTok Shop', 'ID', 'Beauty', 42, 94000,
  5200000000, 55000, 4.7, 12800, 168000, 22, 18,
  'manual-parfum-001', 'Bundling sample size dan free gift masih bisa ditiru.', 'Manual TikTok Shop research', 'manual_upload', 'Starter seed. Replace with real research.'
) on conflict (external_id) do update set
  shop_name = excluded.shop_name,
  marketplace = excluded.marketplace,
  country = excluded.country,
  category_focus = excluded.category_focus,
  product_count = excluded.product_count,
  sold_30d = excluded.sold_30d,
  revenue_30d = excluded.revenue_30d,
  avg_price = excluded.avg_price,
  avg_rating = excluded.avg_rating,
  review_count = excluded.review_count,
  followers = excluded.followers,
  live_count = excluded.live_count,
  ad_count = excluded.ad_count,
  top_product_external_id = excluded.top_product_external_id,
  opportunity_gap = excluded.opportunity_gap,
  source = excluded.source,
  source_kind = excluded.source_kind,
  notes = excluded.notes;

insert into public.market_intelligence_creators (
  external_id, creator_name, handle, marketplace, country, category_focus, followers,
  avg_views, engagement_rate, product_count, sold_30d, revenue_30d, commission_rate,
  fit_score, top_product_external_id, source, source_kind, notes
) values (
  'creator-beauty-fit-001', 'Beauty Daily Review', '@beautydailyreview', 'TikTok Shop', 'ID', 'Beauty', 78000,
  32000, 6.4, 18, 6200, 342000000, 12,
  86, 'manual-parfum-001', 'Manual TikTok Shop research', 'manual_upload', 'Starter seed. Replace with real research.'
) on conflict (external_id) do update set
  creator_name = excluded.creator_name,
  handle = excluded.handle,
  marketplace = excluded.marketplace,
  country = excluded.country,
  category_focus = excluded.category_focus,
  followers = excluded.followers,
  avg_views = excluded.avg_views,
  engagement_rate = excluded.engagement_rate,
  product_count = excluded.product_count,
  sold_30d = excluded.sold_30d,
  revenue_30d = excluded.revenue_30d,
  commission_rate = excluded.commission_rate,
  fit_score = excluded.fit_score,
  top_product_external_id = excluded.top_product_external_id,
  source = excluded.source,
  source_kind = excluded.source_kind,
  notes = excluded.notes;

insert into public.market_intelligence_videos (
  external_id, title, format, product_external_id, creator_external_id, marketplace, country,
  views, likes, comments, shares, ctr, cvr, gmv_estimate, hook, cta, duration_sec,
  posted_at, source, source_kind, notes
) values (
  'video-parfum-hook-001', 'Parfum mini yang wanginya awet seharian', 'affiliate_video', 'manual-parfum-001', 'creator-beauty-fit-001', 'TikTok Shop', 'ID',
  840000, 38200, 2100, 4200, 3.8, 4.4, 128000000, 'Aku kira parfum murah cepat hilang, ternyata ini...', 'Cek keranjang kuning sebelum stok habis', 29,
  '2026-05-23T08:00:00.000Z', 'Manual TikTok Shop research', 'manual_upload', 'Starter seed. Replace with real research.'
) on conflict (external_id) do update set
  title = excluded.title,
  format = excluded.format,
  product_external_id = excluded.product_external_id,
  creator_external_id = excluded.creator_external_id,
  marketplace = excluded.marketplace,
  country = excluded.country,
  views = excluded.views,
  likes = excluded.likes,
  comments = excluded.comments,
  shares = excluded.shares,
  ctr = excluded.ctr,
  cvr = excluded.cvr,
  gmv_estimate = excluded.gmv_estimate,
  hook = excluded.hook,
  cta = excluded.cta,
  duration_sec = excluded.duration_sec,
  posted_at = excluded.posted_at,
  source = excluded.source,
  source_kind = excluded.source_kind,
  notes = excluded.notes;

insert into public.market_intelligence_livestreams (
  external_id, title, host_name, host_type, marketplace, country, category_focus,
  product_external_ids, viewers_peak, duration_min, sold_units, revenue, conversion_rate,
  live_date, source, source_kind, notes
) values (
  'live-parfum-001', 'Flash sale parfum roll on viral', 'Glow Lab Official', 'seller', 'TikTok Shop', 'ID', 'Beauty',
  array['manual-parfum-001'], 5400, 180, 3200, 176000000, 5.9,
  '2026-05-23T12:00:00.000Z', 'Manual TikTok Shop research', 'manual_upload', 'Starter seed. Replace with real research.'
) on conflict (external_id) do update set
  title = excluded.title,
  host_name = excluded.host_name,
  host_type = excluded.host_type,
  marketplace = excluded.marketplace,
  country = excluded.country,
  category_focus = excluded.category_focus,
  product_external_ids = excluded.product_external_ids,
  viewers_peak = excluded.viewers_peak,
  duration_min = excluded.duration_min,
  sold_units = excluded.sold_units,
  revenue = excluded.revenue,
  conversion_rate = excluded.conversion_rate,
  live_date = excluded.live_date,
  source = excluded.source,
  source_kind = excluded.source_kind,
  notes = excluded.notes;
