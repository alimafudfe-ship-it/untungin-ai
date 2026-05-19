# Trend Feature Update

Tanggal update: 2026-05-19

## Ringkasan

Proyek sekarang punya sistem tren produk berbasis banyak sumber data. Fitur ini tidak lagi bergantung pada approval Shopee saja.

## File yang ditambahkan

- `lib/trends/types.ts`
- `lib/trends/catalog.ts`
- `lib/trends/scoring.ts`
- `lib/trends/providers.ts`
- `app/api/marketplace/trends/route.ts`
- `docs/MULTI_SOURCE_TRENDS.md`

## File yang diubah

- `components/dashboard/ProductTrendAdvisor.tsx`
- `.env.example`
- `package.json`
- `package-lock.json`
- `lib/reports/reportData.ts`

## Fitur baru

- Filter tren berdasarkan periode: hari ini, minggu ini, bulan ini.
- Filter tren berdasarkan negara, marketplace, kategori, dan keyword.
- Provider status untuk melihat sumber data aktif/config missing/not approved.
- Fallback seed agar fitur tetap tampil walau Shopee belum approved.
- Endpoint API: `GET /api/marketplace/trends`.
- Dukungan external JSON feed melalui env `TREND_FEED_URL`.
- Dukungan feed analytics Shopee pihak ketiga melalui env `SHOPEE_ANALYTICS_FEED_URL`.

## Cara pakai feed eksternal

Tambahkan di `.env.local`:

```bash
TREND_FEED_URL=https://domain-kamu.com/trends.json
SHOPEE_ANALYTICS_FEED_URL=https://domain-kamu.com/shopee-analytics.json
```

Format feed ada di `docs/MULTI_SOURCE_TRENDS.md`.

## Validasi

- `npm run lint` berhasil tanpa error. Masih ada warning lama dari proyek awal.
- `npx tsc --noEmit` berhasil setelah perbaikan kecil report data dan penambahan `@types/nodemailer`.
- `npm run build` berhasil compile, tetapi sandbox timeout di tahap `Collecting page data`, sama seperti sebelumnya. Tidak ada error compile dari fitur tren baru.
