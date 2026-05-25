# Untungin.ai Market Research / Kalodata-like Data

Fitur `Marketplace Trend Analyzer` sudah diperluas agar bisa menampilkan data riset produk seperti tool analytics marketplace: produk, demand, growth, kompetisi, seller, kreator, video, live, iklan, rating, review, dan estimasi revenue.

## File yang ditambahkan/diubah

- `lib/trends/types.ts` — field data riset produk diperluas.
- `lib/trends/providers.ts` — feed JSON sekarang bisa membaca field snake_case dan camelCase.
- `lib/trends/scoring.ts` — skor peluang memakai demand, growth, kompetisi, confidence, sales signal, dan creator/video signal.
- `lib/trends/catalog.ts` — seed data demo ditambah dengan contoh Kalodata-like.
- `components/dashboard/ProductTrendAdvisor.tsx` — kartu UI menampilkan sold 7d/30d, kreator, video, live, iklan, seller, rating, revenue 30d, top creator, link sumber, dan export CSV lengkap.
- `public/feeds/kalodata-like-trends.json` — contoh feed JSON siap pakai.
- `public/template-kalodata-like-research.csv` — template CSV manual research.
- `supabase/migrations/20260523_market_research_kalodata_like.sql` — tabel market research untuk Supabase.

## Cara pakai cepat

1. Jalankan app seperti biasa.
2. Buka dashboard dan masuk ke bagian `Marketplace Trend Analyzer`.
3. Filter channel `TikTok Shop`, `Shopee`, `Tokopedia`, atau `Lazada`.
4. Klik `Export hasil riset CSV` untuk ambil data riset.

## Cara hubungkan feed legal/manual

Upload file JSON dengan format seperti:

```json
{
  "items": [
    {
      "productName": "Parfum roll on viral 10ml",
      "category": "Beauty",
      "keyword": "parfum roll on viral",
      "marketplace": "TikTok Shop",
      "country": "ID",
      "period": "week",
      "demandScore": 91,
      "growthScore": 94,
      "competitionScore": 55,
      "priceMin": 15000,
      "priceMax": 49000,
      "sold7d": 7600,
      "sold30d": 28600,
      "revenue7d": 197600000,
      "revenue30d": 743600000,
      "sellerCount": 146,
      "creatorCount": 82,
      "videoCount": 394,
      "liveCount": 47,
      "adCount": 21,
      "avgRating": 4.7,
      "reviewCount": 4200,
      "opportunityScore": 86,
      "source": "Manual research",
      "sourceKind": "manual_upload",
      "confidence": 78,
      "notes": "Data riset manual."
    }
  ]
}
```

Lalu isi environment variable:

```bash
KALODATA_LIKE_FEED_URL=https://domain-kamu.com/feeds/kalodata-like-trends.json
```

Alternatif tetap bisa pakai variable yang sudah ada:

```bash
TREND_FEED_URL=https://domain-kamu.com/feeds/kalodata-like-trends.json
TIKTOK_ANALYTICS_FEED_URL=https://domain-kamu.com/feeds/kalodata-like-trends.json
```

## Catatan penting

Data demo di repo adalah contoh/estimasi untuk workflow dan presentasi app. Untuk produksi, isi data dari riset manual, official API, partner feed legal, atau input admin. Jangan klaim data real-time kalau sumbernya masih manual/estimasi.
