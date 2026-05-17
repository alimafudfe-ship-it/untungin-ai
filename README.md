# Untungin.ai v11 — Auto Mapping + Import Preview

AI Profit OS untuk seller Indonesia. v11 membuat import CSV lebih aman untuk marketplace asli seperti Shopee, Tokopedia, Lazada, TikTok Shop, dan reseller karena kolom dibaca otomatis lalu ditampilkan dalam preview sebelum data masuk database.

## Fokus v11

- Auto detect marketplace dari header CSV.
- Auto mapping kolom `Harga Jual`, `Total Harga Produk`, `Qty`, `HPP`, `Fee Admin`, `Biaya Layanan`, `Voucher Seller`, `Subsidi Ongkir`, `Pajak`, `Iklan`, `Komisi Affiliate`, dan `Settlement`.
- Import preview modal sebelum confirm import.
- Confidence score untuk mapping kolom.
- Warning kalau HPP/harga/fee tidak ketemu atau margin terlihat tidak realistis.
- Ongkir pembeli tidak dianggap beban seller; subsidi ongkir seller dan biaya pengiriman yang dipotong dianggap beban seller.
- Template CSV v11 untuk demo marketplace Indonesia.

## Setelah deploy v11

1. Upload ke GitHub.
2. Tunggu Vercel Deployments status `Ready`.
3. Jalankan SQL opsional:

```text
supabase/production_v11_auto_mapping_schema.sql
```

4. Kalau data lama dari v9/v10 mau dibersihkan untuk test ulang:

```sql
delete from public.order_items;
delete from public.orders;
delete from public.products;
delete from public.import_jobs;
delete from public.ai_insights;
delete from public.activation_events;
```

5. Import ulang CSV melalui tombol `Import CSV pertama` / `Import CSV lagi`.

## File penting

- `lib/dashboard/marketplaceImport.ts` — auto mapping engine.
- `components/saas/ImportPreviewModal.tsx` — modal preview sebelum confirm.
- `app/api/import/marketplace/route.ts` — server import setelah preview confirmed.
- `public/template-import-marketplace-untungin-v11.csv` — template CSV Indonesia.

## Production readiness update

Perbaikan terbaru membuat repo lebih siap dipasang di Vercel dan lebih aman untuk kolaborasi tim:

1. Jalankan dependency dari lockfile yang sudah disinkronkan:

```bash
npm install
```

2. Salin konfigurasi environment:

```bash
cp .env.example .env.local
```

3. Isi minimal variabel berikut sebelum deploy:

```text
NEXT_PUBLIC_APP_URL=https://domain-kamu.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_ADMIN_EMAILS=admin@domain-kamu.com
```

4. Validasi lokal:

```bash
npm run lint
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Catatan: folder `upgrade/` dan file snapshot lama tetap disimpan sebagai arsip, tetapi dikecualikan dari lint karena bukan source app utama yang dipakai Next.js.

## SaaS Professional Dashboard Refresh

Versi ini memperbarui pengalaman utama Untungin.ai agar terasa seperti SaaS B2B profesional:

- Shell aplikasi baru dengan sidebar enterprise, workspace card, plan status, dan topbar global.
- Overview diubah menjadi Seller Command Center dengan KPI operasional, risk score, net cash position, PRO readiness, dan AI daily decision.
- Hero lama yang terlalu landing-page diganti menjadi command center yang compact dan decision-oriented.
- Copywriting diperhalus agar lebih cocok untuk seller marketplace Indonesia dan demo investor/customer.
- Mobile navigation tetap tersedia untuk layar kecil.

Validasi yang sudah dilakukan:

```bash
npm run lint
NEXT_TELEMETRY_DISABLED=1 npm run build
```

Build production berhasil. Lint tidak memiliki error, hanya warning lama terkait `any` dan unused variable pada modul yang belum disentuh.

## Supabase-first production mode

Versi ini tidak lagi otomatis masuk dashboard dengan data demo saat session Supabase tidak ada. Untuk production:

1. Isi ENV di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Jalankan schema SQL di folder `supabase/` melalui Supabase SQL Editor.
3. Aktifkan Authentication provider yang dipakai, minimal Email OTP atau Google OAuth.
4. Redeploy di Vercel.

Behavior baru:
- Pengunjung belum login diarahkan ke `/login`.
- Jika ENV Supabase kosong, app menampilkan layar setup, bukan dashboard demo.
- Produk, arus kas, stok, import CSV, workspace, dan plan memakai tabel Supabase.
- Data demo hanya boleh dipakai kalau nanti dibuat flow demo terpisah, bukan default production dashboard.

## Marketplace-wide Trend Intelligence

This build adds a marketplace-wide trend explorer that is intentionally not based on the seller's internal products. It provides a market intelligence layer for public marketplace trend research across products, categories, keywords, countries, and marketplaces.

Current implementation includes a seeded marketplace trend dataset for UI and workflow validation. For production-grade real-time trends, replace or enrich the dataset through compliant data providers, marketplace APIs, Google Trends, keyword tools, or uploaded public trend datasets.
