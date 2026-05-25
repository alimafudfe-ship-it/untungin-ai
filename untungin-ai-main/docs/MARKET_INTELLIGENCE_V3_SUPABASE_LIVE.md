# Untungin Market Intelligence V3 - Supabase Live Data

V2 masih bisa memakai sample JSON lokal agar demo terlihat. V3 ini menambahkan mode produksi supaya data yang tampil berasal dari Supabase atau feed legal, bukan dari `public/feeds` lokal.

## 1. Jalankan migration Supabase

Buka Supabase SQL Editor, lalu jalankan:

```sql
supabase/migrations/20260523_market_intelligence_v2_full.sql
```

Migration tersebut membuat tabel:

- `market_intelligence_products`
- `market_intelligence_categories`
- `market_intelligence_shops`
- `market_intelligence_creators`
- `market_intelligence_videos`
- `market_intelligence_livestreams`
- `market_intelligence_import_batches`

## 2. Isi Environment Variables di Vercel

Minimal untuk baca database:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
MARKET_INTELLIGENCE_MODE=supabase
MARKET_INTELLIGENCE_USE_DEMO=false
```

Untuk endpoint import/upsert JSON:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
MARKET_INTELLIGENCE_ADMIN_TOKEN=ganti-token-rahasia-panjang
```

Opsional kalau punya feed legal/partner:

```env
MARKET_INTELLIGENCE_FEED_URL=https://domain-kamu.com/feeds/market-intelligence-v2.json
KALODATA_LIKE_FEED_URL=https://domain-kamu.com/feeds/market-intelligence-v2.json
```

## 3. Mode data

```env
MARKET_INTELLIGENCE_MODE=auto
```

Urutan: Supabase -> JSON feed -> demo fallback.

```env
MARKET_INTELLIGENCE_MODE=supabase
MARKET_INTELLIGENCE_USE_DEMO=false
```

Hanya baca Supabase. Jika tabel kosong, dashboard menampilkan kosong dan memberi pesan bahwa database belum terisi.

```env
MARKET_INTELLIGENCE_MODE=feed
MARKET_INTELLIGENCE_USE_DEMO=false
```

Hanya baca JSON feed legal/partner.

## 4. Import data ke Supabase lewat API

Endpoint:

```txt
POST /api/market-intelligence/import
```

Header:

```txt
Authorization: Bearer <MARKET_INTELLIGENCE_ADMIN_TOKEN>
Content-Type: application/json
```

Body contoh:

```json
{
  "sourceName": "Manual research batch 001",
  "sourceKind": "csv_import",
  "products": [
    {
      "id": "manual-parfum-001",
      "productName": "Parfum roll on viral 10ml",
      "category": "Beauty",
      "keyword": "parfum roll on",
      "marketplace": "TikTok Shop",
      "country": "ID",
      "period": "week",
      "priceMin": 15000,
      "priceMax": 49000,
      "sold7d": 1200,
      "sold30d": 94000,
      "revenue7d": 48000000,
      "revenue30d": 5200000000,
      "growth7d": 24,
      "growth30d": 68,
      "sellerCount": 180,
      "creatorCount": 240,
      "videoCount": 850,
      "liveCount": 72,
      "adCount": 34,
      "avgRating": 4.7,
      "reviewCount": 12800,
      "demandScore": 92,
      "growthScore": 88,
      "competitionScore": 63,
      "opportunityScore": 86,
      "saturationScore": 64,
      "marginSignal": 78,
      "signal": "viral",
      "source": "Manual TikTok Shop research",
      "sourceKind": "manual_upload",
      "notes": "Data riset manual, bukan scraping ilegal."
    }
  ],
  "categories": [],
  "shops": [],
  "creators": [],
  "videos": [],
  "lives": []
}
```

Contoh cURL:

```bash
curl -X POST "https://domain-kamu.com/api/market-intelligence/import" \
  -H "Authorization: Bearer TOKEN_KAMU" \
  -H "Content-Type: application/json" \
  --data @market-intelligence-batch.json
```

## 5. Cara cek sudah bukan data lokal

Buka halaman Market Intel. Badge atas akan menampilkan:

- `Source: Supabase Market Intelligence DB`
- `Bukan data lokal`

Kalau masih tertulis `Demo local fallback`, berarti Vercel ENV belum benar, migration belum dijalankan, atau tabel Supabase masih kosong.

## 6. Catatan legal

Aplikasi ini tidak mengambil data TikTok Shop secara ilegal. Data produksi harus berasal dari:

- input manual,
- CSV/JSON dari tim riset,
- data partner/legal feed,
- API resmi/approved marketplace.
