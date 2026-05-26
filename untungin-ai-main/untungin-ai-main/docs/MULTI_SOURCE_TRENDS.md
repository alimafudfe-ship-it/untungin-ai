# Multi-source Marketplace Trends

Fitur tren tidak lagi bergantung pada approval Shopee saja. Layer baru ada di:

- `lib/trends/types.ts` — kontrak data tren.
- `lib/trends/catalog.ts` — fallback seed agar UI tetap jalan.
- `lib/trends/scoring.ts` — scoring, filter, dedupe.
- `lib/trends/providers.ts` — agregator multi-source.
- `app/api/marketplace/trends/route.ts` — API read-only untuk UI.
- `components/dashboard/ProductTrendAdvisor.tsx` — UI dashboard yang fetch API dan fallback lokal.

## Provider yang sudah disiapkan

1. Built-in fallback seed
   - Selalu aktif.
   - Dipakai ketika Shopee belum approve atau belum ada feed eksternal.

2. Custom JSON feed
   - Set env `TREND_FEED_URL`.
   - Format boleh array langsung atau `{ "items": [...] }`.

3. Shopee Analytics feed
   - Set env `SHOPEE_ANALYTICS_FEED_URL` bila memakai export/API pihak ketiga.

4. Shopee official API
   - Status ditampilkan, tetapi tidak dipakai sebagai sumber public trend karena approval dan use case resmi tetap dibutuhkan.

## Format JSON feed

```json
{
  "items": [
    {
      "productName": "Serum niacinamide",
      "category": "Beauty",
      "keyword": "serum brightening",
      "marketplace": "Shopee",
      "country": "ID",
      "period": "week",
      "demandScore": 90,
      "growthScore": 82,
      "competitionScore": 65,
      "priceMin": 28000,
      "priceMax": 79000,
      "monthlyUnits": 12000,
      "monthlyRevenue": 680000000,
      "signal": "rising",
      "confidence": 82,
      "source": "Vendor trend export"
    }
  ]
}
```

## Env tambahan

Tambahkan ke `.env.local` bila tersedia:

```bash
TREND_FEED_URL=https://example.com/trends.json
SHOPEE_ANALYTICS_FEED_URL=https://example.com/shopee-analytics.json
```
