# Untungin AI Realtime Market Intelligence

## Features Added

- Shopee realtime worker
- Tokopedia parser scaffold
- TikTok crawler scaffold
- Trend scoring engine
- Opportunity scoring
- Live movement score
- Auto cron scheduler
- Supabase realtime schema

## Required ENV

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

## Run Worker

npm install node-cron
npm run dev

## Recommended Production Stack

- Playwright stealth crawler
- Rotating proxy
- Queue: BullMQ
- Redis cache
- Supabase realtime
- Vercel cron / Railway worker
