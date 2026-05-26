# Untungin.ai v6 — REAL DATA VERSION

v6 mengubah Untungin.ai dari dashboard demo menjadi fondasi SaaS data real untuk seller Indonesia.

## Yang ditambahkan

- **Auth production**: Supabase Auth tetap jadi sumber user/session, dengan helper workspace default.
- **Supabase schema production**: `supabase/production_v6_real_data_schema.sql` berisi workspace, members, stores, marketplace connections, products, orders, expenses, AI insights, import jobs, subscriptions, RLS, dan realtime publication.
- **CSV import real**: route `app/api/import/marketplace/route.ts` menerima CSV Shopee/Tokopedia/TikTok/Lazada/manual, normalisasi kolom, insert products, membuat import job, dan menghasilkan AI insights awal.
- **AI insight generator**: `lib/saas/aiInsights.ts` memberi warning produk rugi, stok kritis, expense pressure, fee marketplace, dan produk siap scale.
- **Onboarding flow**: `app/onboarding/page.tsx` + `components/saas/OnboardingWizard.tsx` untuk user baru: workspace → toko → import CSV → insight.
- **Realtime hooks**: `lib/saas/realtime.ts` subscribe products, expenses, orders, dan ai_insights per workspace.
- **Multi-store logic**: `lib/saas/workspace.ts` membuat workspace default, member owner, dan toko utama.

## Deploy checklist

1. Buat project Supabase.
2. Isi env Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY` optional untuk AI generatif
   - `MIDTRANS_SERVER_KEY` dan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
3. Jalankan SQL: `supabase/production_v6_real_data_schema.sql`.
4. Aktifkan Supabase Auth Google provider kalau ingin Google login.
5. Deploy ke Vercel dengan Clear Build Cache.

## Catatan penting

- Shopee official API butuh approval partner. Untuk MVP Indonesia, CSV import adalah jalur paling cepat dan realistis.
- TikTok Shop/Tokopedia/Lazada API bisa menjadi premium connector setelah produk punya user awal.
- Import route mendukung mode preview bila env Supabase belum diset.
