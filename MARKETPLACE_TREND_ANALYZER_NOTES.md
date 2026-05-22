# Marketplace Trend Analyzer Update

Fitur yang ditambahkan untuk positioning Untungin.ai sebagai alat riset produk trending untuk seller marketplace Indonesia.

## Fitur UI

- Marketplace Trend Analyzer di halaman Marketplace/Integrasi dan Insight AI.
- Quick tab: Semua marketplace, Shopee Trend, TikTok Shop Trend, Tokopedia Trend, Lazada Trend.
- Filter periode: Hari ini, Minggu ini, Bulan ini, Hari besar.
- Filter negara, kategori, marketplace, dan keyword.
- Rekomendasi produk jualan berdasarkan demand, growth, kompetisi, harga, dan peluang margin.
- Export hasil riset produk ke CSV.
- Provider status untuk demo data, feed analytics, dan kredensial official API.

## Sumber Data

Mode demo menggunakan fallback seed legal tanpa scraping agar buyer/reviewer bisa melihat workflow.
Untuk data live legal, isi ENV feed analytics berikut jika sudah punya provider/partner data:

- TREND_FEED_URL
- SHOPEE_ANALYTICS_FEED_URL
- TIKTOK_ANALYTICS_FEED_URL
- TOKOPEDIA_ANALYTICS_FEED_URL
- LAZADA_ANALYTICS_FEED_URL

Format feed bisa array JSON atau `{ "items": [...] }` dengan field contoh:

```json
{
  "productName": "Serum brightening",
  "category": "Beauty",
  "keyword": "serum brightening",
  "marketplace": "Shopee",
  "country": "ID",
  "period": "week",
  "demandScore": 90,
  "growthScore": 84,
  "competitionScore": 58,
  "priceMin": 25000,
  "priceMax": 79000,
  "monthlyUnits": 12000,
  "monthlyRevenue": 650000000,
  "signal": "rising",
  "confidence": 78,
  "source": "Partner analytics feed"
}
```

## File utama yang berubah

- `components/dashboard/ProductTrendAdvisor.tsx`
- `lib/trends/catalog.ts`
- `lib/trends/providers.ts`
