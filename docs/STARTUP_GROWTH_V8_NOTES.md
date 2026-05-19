# Untungin.ai v8 - Growth & Production Mode

v8 mengubah produk dari dashboard serius menjadi mesin startup yang lebih siap dijual ke user pertama.

## Fokus v8

- Growth Engine tab untuk founder cockpit.
- Founder action board: tindakan prioritas berbasis data profit, stok, cashflow, dan expense.
- Growth metrics: activation, AI value, monetization, retention.
- Billing fallback tetap jalan walau Midtrans ditolak: Xendit/manual.
- API action plan: `/api/growth/action-plan`.
- Supabase migration baru: `supabase/production_v8_growth_engine_schema.sql`.

## Cara pakai setelah deploy

1. Upload v8 ke GitHub.
2. Deploy ke Vercel.
3. Jalankan SQL berurutan di Supabase:
   - `supabase/production_v6_real_data_schema.sql`
   - `supabase/production_v7_startup_serious_schema.sql`
   - `supabase/production_v8_growth_engine_schema.sql`
4. Set environment variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `PAYMENT_PROVIDER=xendit` atau `PAYMENT_PROVIDER=manual`
   - `NEXT_PUBLIC_PAYMENT_PROVIDER=xendit` atau `NEXT_PUBLIC_PAYMENT_PROVIDER=manual`

## Strategi produk

Jangan lawan Ginee/Jubelio/Sirclo dengan jumlah fitur. Menang dengan alur:

CSV marketplace -> profit asli -> AI action plan -> daily briefing -> upgrade PRO.

North-star metric yang disarankan: profit decisions executed per seller per week.
