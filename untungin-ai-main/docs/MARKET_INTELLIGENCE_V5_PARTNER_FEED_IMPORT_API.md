# Untungin Market Intelligence V5 - Partner Feed + Import API

V5 membuat Untungin siap disambungkan ke data provider resmi/legal. Data partner masuk ke server API Untungin, lalu di-upsert ke tabel Supabase dan tampil di dashboard Market Intel.

## 1. Jalankan migration

Buka Supabase SQL Editor, lalu jalankan:

```text
supabase/migrations/20260524_market_intelligence_partner_feed_v5.sql
```

Pastikan migration V2/V3/V4 sudah dijalankan lebih dulu karena V5 memakai tabel Market Intelligence yang sudah dibuat sebelumnya.

## 2. ENV di Vercel

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
MARKET_INTELLIGENCE_MODE=supabase
MARKET_INTELLIGENCE_USE_DEMO=false
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
MARKET_INTELLIGENCE_ADMIN_TOKEN=token-admin-rahasia
MARKET_INTELLIGENCE_PARTNER_TOKEN=token-partner-rahasia
```

`SUPABASE_SERVICE_ROLE_KEY` dan `MARKET_INTELLIGENCE_PARTNER_TOKEN` hanya dipakai server-side. Jangan taruh di frontend.

## 3. Endpoint Partner Feed

Semua endpoint memakai JSON dan token:

```text
Authorization: Bearer MARKET_INTELLIGENCE_PARTNER_TOKEN
```

Endpoint:

```text
POST /api/market-intelligence/partner-feed/products
POST /api/market-intelligence/partner-feed/shops
POST /api/market-intelligence/partner-feed/creators
POST /api/market-intelligence/partner-feed/videos
POST /api/market-intelligence/partner-feed/lives
POST /api/market-intelligence/partner-feed/categories
POST /api/market-intelligence/partner-feed/sources
```

Health check:

```text
GET /api/market-intelligence/partner-feed
```

## 4. Contoh import produk

```bash
curl -X POST "https://domain-kamu.vercel.app/api/market-intelligence/partner-feed/products" \
  -H "content-type: application/json" \
  -H "authorization: Bearer token-partner-rahasia" \
  -d @public/examples/partner-feed-products-v5.json
```

Payload minimal:

```json
{
  "partner_name": "Legal Data Partner Demo",
  "marketplace": "Shopee",
  "country": "ID",
  "period": "week",
  "items": [
    {
      "external_id": "partner-shopee-kaos-001",
      "product_name": "Kaos pocket pria semi katun",
      "category": "Fashion",
      "keyword": "kaos pria",
      "price_min": 25000,
      "price_max": 59000,
      "sold_30d": 12000,
      "revenue_30d": 480000000,
      "demand_score": 82,
      "growth_score": 74,
      "competition_score": 55,
      "opportunity_score": 78,
      "source_url": "https://shopee.co.id/..."
    }
  ]
}
```

## 5. Import log

Setiap import akan dicatat ke tabel:

```text
market_intelligence_partner_import_logs
```

Cek log:

```sql
select *
from public.market_intelligence_partner_import_logs
order by created_at desc
limit 20;
```

## 6. Model bisnis yang disarankan

Untuk app yang dijual ke user, jangan menjanjikan scraping ilegal atau data real-time yang tidak punya sumber resmi. Positioning aman:

```text
Untungin Market Intelligence memakai data partner legal, public trend signal, dan riset marketplace untuk membantu seller menemukan peluang produk.
```

## 7. Catatan penting

- API V5 tidak scraping otomatis.
- Data harus berasal dari API resmi, partner data, atau riset legal.
- `external_id` menjadi kunci upsert. Jika ID sama dikirim ulang, data akan update, bukan membuat duplikat.
- Untuk data TikTok/Shopee/Tokopedia/Lazada yang benar-benar real-time, gunakan vendor data/legal API.
