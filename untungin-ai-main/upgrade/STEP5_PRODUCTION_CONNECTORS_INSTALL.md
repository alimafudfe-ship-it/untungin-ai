# STEP 5 Production Connectors Install

Upload semua isi ZIP ke root GitHub project, commit, lalu tunggu Vercel deploy.

## 1. Jalankan SQL migration
Supabase > SQL Editor > New Query > paste isi:

`supabase/migrations/20260513_step5_production_integrations.sql`

Run sampai sukses.

## 2. Tambahkan ENV di Vercel
Minimal:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
NEXT_PUBLIC_APP_URL=https://untungin-ai-pmd1.vercel.app
CRON_SECRET=buat-secret-sendiri
```

Untuk WhatsApp Fonnte:

```env
WHATSAPP_PROVIDER=fonnte
FONNTE_TOKEN=token_fonnte
```

Untuk SMTP daily email:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app_password
SMTP_FROM=Untungin.ai <email@gmail.com>
DAILY_REPORT_TO=email_tujuan@gmail.com
```

Untuk marketplace OAuth:

```env
SHOPEE_PARTNER_ID=
SHOPEE_PARTNER_KEY=
SHOPEE_REDIRECT_URL=https://untungin-ai-pmd1.vercel.app/api/marketplace/oauth-callback
TOKOPEDIA_CLIENT_ID=
TOKOPEDIA_CLIENT_SECRET=
TOKOPEDIA_REDIRECT_URL=https://untungin-ai-pmd1.vercel.app/api/marketplace/oauth-callback
```

Untuk Midtrans:

```env
MIDTRANS_SERVER_KEY=
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
```

## 3. Endpoint baru

- `/api/reports/pdf`
- `/api/reports/csv`
- `/api/finance-chat`
- `/api/charts/realtime`
- `/api/marketplace/shopee/oauth-url`
- `/api/marketplace/tokopedia/oauth-url`
- `/api/marketplace/oauth-callback`
- `/api/cron/daily-email?secret=...`
- `/api/alerts/stock-whatsapp`
- `/api/team/invite`
- `/api/onboarding/complete`

## 4. Catatan
Shopee/Tokopedia OAuth membutuhkan akun partner resmi. Tanpa credential resmi, tombol connect akan fallback ke pesan env missing.
