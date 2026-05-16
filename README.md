# Untungin.ai v9 — First Customer Ready

AI Profit OS untuk seller Indonesia. v9 fokus ke user pertama: onboarding, import CSV real, AI insight otomatis, workspace/store activation, dan manual billing fallback.

Lihat `FIRST_CUSTOMER_READY_V9_NOTES.md` untuk instruksi v9.

# Untungin.ai v8 Growth Engine (legacy notes)

AI Profit OS untuk seller marketplace Indonesia. v9 menambahkan First Customer Ready flow di atas Growth Engine v8: onboarding, import CSV real, AI insight otomatis, dan manual upgrade request.

## Core positioning

Bukan ERP biasa. Untungin.ai fokus pada profit asli, cashflow leak, restock decision, daily briefing, dan tindakan harian yang bisa langsung dieksekusi seller Indonesia.

## Quick start

```bash
npm install
npm run build
npm run dev
```

## Supabase SQL order

Jalankan di Supabase SQL Editor:

1. `supabase/production_v6_real_data_schema.sql`
2. `supabase/production_v7_startup_serious_schema.sql`
3. `supabase/production_v8_growth_engine_schema.sql`

## Environment variables

```env
NEXT_PUBLIC_APP_URL=https://domain-anda.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
PAYMENT_PROVIDER=xendit
NEXT_PUBLIC_PAYMENT_PROVIDER=xendit
XENDIT_SECRET_KEY=
XENDIT_CALLBACK_TOKEN=
```

Jika Xendit belum aktif, gunakan:

```env
PAYMENT_PROVIDER=manual
NEXT_PUBLIC_PAYMENT_PROVIDER=manual
```

## v8 additions

- Growth Engine tab.
- Founder action board.
- Growth metrics: activation, AI value, monetization, retention.
- `/api/growth/action-plan` endpoint.
- Supabase tables: growth action plans, activation events, billing requests, customer interviews.
