# Untungin.ai Step 2 No.2 - Business Core

Isi update ini:

1. Real cashflow engine
   - cash in / cash out / net cashflow
   - cashflow trend
   - expense ratio
   - dashboard realtime dengan Supabase channel

2. Professional charts
   - cashflow trend chart
   - profit trend chart
   - expense breakdown donut
   - monthly summary bars

3. Expense analytics
   - biaya per kategori
   - kategori terbesar
   - expense ratio terhadap profit

4. Profit analytics
   - ranking produk by profit
   - inventory risk list
   - insight otomatis berbasis rules engine

5. Reports PDF/CSV
   - export produk CSV
   - export expenses CSV
   - export cashflow CSV
   - export summary JSON
   - printable business report yang bisa di-save sebagai PDF dari browser

## Cara pasang

1. Upload semua isi ZIP ini ke repo GitHub, atau replace project lokal dengan isi ZIP ini.
2. Jalankan SQL migration baru di Supabase SQL Editor:
   - `supabase/migrations/20260513_cashflow_reports.sql`
3. Pastikan migration expense sebelumnya juga sudah dijalankan:
   - `supabase/migrations/20260513_expense_engine.sql`
4. Commit ke GitHub.
5. Vercel akan redeploy otomatis.

## File penting yang berubah

- `app/page.tsx`
- `app/layout.tsx`
- `components/dashboard/AppShell.tsx`
- `components/dashboard/Charts.tsx`
- `components/dashboard/ReportsPanel.tsx`
- `lib/dashboard/analytics.ts`
- `lib/dashboard/reports.ts`
- `types/dashboard.ts`
- `supabase/migrations/20260513_cashflow_reports.sql`

## Catatan

Fitur PDF memakai printable report browser. Klik `Print / Save PDF`, lalu pilih `Save as PDF` di dialog print Chrome.
