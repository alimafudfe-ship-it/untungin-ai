# Untungin.ai V2 Full Market Intelligence

V2 ini mengubah menu **Trend Produk** menjadi modul **Market Intelligence** yang lebih lengkap seperti workflow Kalodata, tetapi dengan label data aman untuk produksi: demo seed, manual research, CSV upload, atau partner/legal feed.

## Modul yang ditambahkan

- Overview peluang pasar
- Produk Trending
- Kategori naik
- Toko/kompetitor
- Kreator affiliate
- Video & Ads
- Live Commerce
- Import/Admin CSV dan JSON feed

## File penting

- `components/dashboard/MarketIntelligenceSuite.tsx`
- `app/api/market-intelligence/route.ts`
- `lib/market-intelligence/types.ts`
- `lib/market-intelligence/sampleData.ts`
- `lib/market-intelligence/scoring.ts`
- `lib/market-intelligence/providers.ts`
- `public/feeds/market-intelligence-v2.json`
- `public/template-market-intelligence-v2.csv`
- `supabase/migrations/20260523_market_intelligence_v2_full.sql`

## Environment variable opsional

Tambahkan di Vercel jika ingin mengganti/menambah data demo dengan feed legal:

```env
MARKET_INTELLIGENCE_FEED_URL=https://domain-kamu.com/feeds/market-intelligence-v2.json
KALODATA_LIKE_FEED_URL=https://domain-kamu.com/feeds/market-intelligence-v2.json
```

Jika ENV belum diisi, aplikasi tetap berjalan memakai data demo V2.

## Endpoint API

```text
/api/market-intelligence
```

Query yang didukung:

```text
period=today|week|month|special_day
marketplace=All|TikTok Shop|Shopee|Tokopedia|Lazada
country=All|ID|MY|SG
category=All|Beauty|Fashion|...
sort=opportunity|sales|revenue|growth|competition|updated
q=keyword pencarian
```

Contoh:

```text
/api/market-intelligence?period=week&marketplace=TikTok%20Shop&sort=opportunity
```

## Catatan legal/data

V2 ini tidak melakukan scraping otomatis. Untuk data produksi, gunakan salah satu sumber berikut:

1. Riset manual dan CSV upload.
2. JSON feed internal dari tim riset.
3. API resmi marketplace sesuai approval.
4. Partner/legal data provider.

Gunakan label data yang jelas di UI: `demo_seed`, `manual_upload`, `partner_feed`, `official_api`, atau `csv_import`.

## Cara deploy

1. Upload ZIP ini ke GitHub.
2. Deploy ulang project Vercel.
3. Buka menu **Market Intel** atau **Trend Produk**.
4. Cek endpoint `/api/market-intelligence`.
5. Jika memakai feed sendiri, isi ENV di Vercel lalu redeploy.
