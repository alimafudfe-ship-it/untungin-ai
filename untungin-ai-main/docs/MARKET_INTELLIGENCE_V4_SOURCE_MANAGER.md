# Untungin Market Intelligence V4 - Marketplace Source Link Manager

V4 menambahkan fitur **Marketplace Link Source Manager** di tab **Market Intel -> Import/Admin**. Tujuannya agar admin tidak perlu input data per marketplace satu per satu dari awal. Admin bisa menyimpan link Tokopedia, Shopee, TikTok Shop, Lazada, produk, toko, kategori, atau search keyword sebagai antrean riset.

> Catatan: fitur ini **menyimpan link sebagai sumber riset**, bukan scraping otomatis. Data produk, toko, kreator, video, dan live tetap harus masuk dari riset manual, CSV/JSON, API resmi, atau partner feed legal.

## 1. Jalankan migration V4 di Supabase

Buka **Supabase -> SQL Editor -> New query**, copy semua isi file ini, lalu klik **Run**:

```txt
supabase/migrations/20260524_market_intelligence_sources_v4.sql
```

Migration ini membuat tabel:

```txt
market_intelligence_sources
```

Kolom utama:

```txt
external_id
title
marketplace
source_type
source_url
keyword
category
country
status
last_checked_at
next_check_at
extracted_count
created_by
notes
```

## 2. ENV Vercel untuk simpan link

Minimal database live tetap sama:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
MARKET_INTELLIGENCE_MODE=supabase
MARKET_INTELLIGENCE_USE_DEMO=false
```

Agar tombol **Simpan link marketplace** bisa menyimpan ke Supabase, tambahkan juga:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
MARKET_INTELLIGENCE_ADMIN_TOKEN=token-rahasia-kamu
```

Setelah menambah ENV, lakukan **Redeploy** di Vercel.

## 3. Cara pakai di app

1. Buka **Market Intel**.
2. Klik tab **Import/Admin**.
3. Masukkan **Admin token** yang sama dengan `MARKET_INTELLIGENCE_ADMIN_TOKEN`.
4. Pilih marketplace: TikTok Shop, Shopee, Tokopedia, Lazada, Manual, atau Public Feed.
5. Pilih jenis link: search, product, shop, category, creator, video, live, keyword, atau other.
6. Paste URL marketplace.
7. Isi keyword/kategori/catatan.
8. Klik **Simpan link marketplace**.

Link akan tersimpan di Supabase sebagai source riset.

## 4. Endpoint API baru

### List source link

```txt
GET /api/market-intelligence/sources
```

Opsional filter:

```txt
GET /api/market-intelligence/sources?marketplace=Tokopedia&q=powerbank
```

### Simpan source link

```txt
POST /api/market-intelligence/sources
```

Header:

```txt
x-market-intelligence-token: <MARKET_INTELLIGENCE_ADMIN_TOKEN>
content-type: application/json
```

Body contoh:

```json
{
  "title": "Tokopedia powerbank fast charging",
  "marketplace": "Tokopedia",
  "sourceType": "search",
  "sourceUrl": "https://www.tokopedia.com/search?st=product&q=powerbank%20fast%20charging",
  "keyword": "powerbank fast charging",
  "category": "Elektronik",
  "country": "ID",
  "status": "queued",
  "notes": "Cek 20 listing pertama, catat harga, review negatif, dan seller teratas."
}
```

## 5. Alur kerja yang disarankan

```txt
1. Admin paste banyak link marketplace ke Source Manager.
2. Tim riset membuka link satu per satu.
3. Hasil riset dimasukkan via CSV/JSON/API import.
4. Dashboard Produk/Toko/Kreator/Video/Live membaca data dari Supabase.
5. Source link tetap tersimpan sebagai audit trail dan daftar pekerjaan riset.
```

## 6. Kenapa tidak otomatis scraping?

Banyak marketplace memakai login, proteksi bot, captcha, dan aturan penggunaan data. Untuk menghindari risiko akun/platform, V4 memakai pendekatan aman:

- simpan link sumber riset,
- import data dari riset manual/legal,
- siap dihubungkan ke API resmi atau partner data feed.

## 7. File yang ditambahkan/diubah

```txt
app/api/market-intelligence/sources/route.ts
components/dashboard/MarketIntelligenceSuite.tsx
lib/market-intelligence/types.ts
lib/market-intelligence/providers.ts
lib/market-intelligence/scoring.ts
lib/market-intelligence/sampleData.ts
supabase/migrations/20260524_market_intelligence_sources_v4.sql
docs/MARKET_INTELLIGENCE_V4_SOURCE_MANAGER.md
```
