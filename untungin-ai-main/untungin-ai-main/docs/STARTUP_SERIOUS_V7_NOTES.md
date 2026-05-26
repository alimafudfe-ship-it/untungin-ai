# Untungin.ai v7 - Startup Serious Version

Tujuan v7: membuat Untungin.ai bukan sekadar dashboard, tapi AI Profit OS untuk seller Indonesia.

## Apa yang baru

1. Startup OS / Moat tab
   - Battlecard melawan pola Jubelio/Ginee/Sirclo/spreadsheet.
   - North-star metric: keputusan profit yang dieksekusi per hari.
   - Growth wedge: profit asli, daily AI briefing, mobile-first, billing anti-blocker.

2. Billing tidak bergantung Midtrans
   - Default provider: Xendit.
   - Manual transfer fallback untuk early customer.
   - Midtrans tetap opsional kalau akun nanti disetujui.

3. Xendit checkout foundation
   - POST /api/create-payment sekarang support PAYMENT_PROVIDER=xendit|manual|midtrans.
   - POST /api/webhook/xendit untuk update PRO saat invoice paid.

4. Supabase v7 migration
   - billing_checkout_sessions
   - ai_daily_briefings
   - audit_logs
   - growth_experiments

## ENV production yang disarankan

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

Kalau belum punya Xendit aktif:

```env
PAYMENT_PROVIDER=manual
NEXT_PUBLIC_PAYMENT_PROVIDER=manual
```

## Jalankan SQL

1. Jalankan dulu `supabase/production_v6_real_data_schema.sql`
2. Lalu jalankan `supabase/production_v7_startup_serious_schema.sql`

## Catatan strategi

Kompetitor omnichannel besar sudah kuat di operasi. Jangan lawan hanya dengan jumlah fitur. Untungin.ai harus menang di AI decision layer: profit asli, cashflow leak, daily action, dan rekomendasi yang langsung bisa dikerjakan owner toko.
