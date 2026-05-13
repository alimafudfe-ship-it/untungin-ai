# STEP 4 Scale Features Install

Upload semua isi folder ini ke root GitHub repo, commit, lalu tunggu Vercel deploy.

## 1. Jalankan SQL migration
Buka Supabase SQL Editor, paste isi:

`supabase/migrations/20260513_step4_scale_features.sql`

Klik Run.

## 2. Environment variables opsional
Untuk fitur lengkap, tambahkan di Vercel:

### AI Chat
- `OPENAI_API_KEY`
- `OPENAI_MODEL` optional, default `gpt-4o-mini`

### WhatsApp alert
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `OWNER_WHATSAPP_NUMBER`

### Vercel Cron
- `CRON_SECRET`

### Shopee API
- `SHOPEE_PARTNER_ID`
- `SHOPEE_PARTNER_KEY`
- `SHOPEE_REDIRECT_URI`

### Tokopedia API
- `TOKOPEDIA_CLIENT_ID`
- `TOKOPEDIA_CLIENT_SECRET`
- `TOKOPEDIA_REDIRECT_URI`

### Midtrans Subscription
- `MIDTRANS_SERVER_KEY`
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
- `MIDTRANS_IS_PRODUCTION`

## 3. Yang aktif setelah deploy
- Realtime charts panel
- AI finance chatbot with OpenAI fallback rules engine
- Multi-user workspace foundation
- Marketplace API connector foundation
- Forecasting chart AI
- Real PDF export
- Automated daily report endpoint
- WhatsApp stock alert endpoint
- Midtrans subscription foundation
- Mobile bottom nav polish
