# V2 Full Market Intelligence Changelog

Tanggal: 23 Mei 2026

## Ringkasan

Menu Trend Produk sekarang memakai komponen baru **MarketIntelligenceSuite**. Modul ini dibuat lebih full seperti Kalodata workflow: produk, kategori, toko, kreator, video & ads, live commerce, serta import/admin.

## File baru

- `components/dashboard/MarketIntelligenceSuite.tsx`
- `app/api/market-intelligence/route.ts`
- `lib/market-intelligence/types.ts`
- `lib/market-intelligence/sampleData.ts`
- `lib/market-intelligence/scoring.ts`
- `lib/market-intelligence/providers.ts`
- `public/feeds/market-intelligence-v2.json`
- `public/template-market-intelligence-v2.csv`
- `supabase/migrations/20260523_market_intelligence_v2_full.sql`
- `docs/MARKET_INTELLIGENCE_V2_FULL.md`

## File diubah

- `app/page.tsx`: render menu Trend Produk diganti ke `MarketIntelligenceSuite`.
- `components/dashboard/AppShell.tsx`: label menu dan meta header diperbarui menjadi Market Intelligence.

## Status cek

- TypeScript check untuk app/dashboard dan modul Market Intelligence: OK.
- Full `npx tsc --noEmit` seluruh repo masih terkena file backup/root lama seperti `dashboard.ts` dan `route (8).ts`, yang sudah ada dari repo awal.

## Catatan data

V2 tidak scraping otomatis. Data produksi harus masuk lewat:

- Riset manual/CSV.
- JSON feed internal.
- Partner/legal feed.
- API marketplace resmi sesuai approval.
