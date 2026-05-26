# V6 Changelog — Real Data Version

## Core production foundation
- Added Supabase production schema for workspace SaaS: workspaces, members, stores, products, orders, order_items, expenses, marketplace_connections, import_jobs, ai_insights, subscriptions.
- Added RLS policies so data is scoped by workspace/team membership.
- Added realtime publication for products, expenses, orders, and ai_insights.

## Auth + workspace
- Dashboard now attempts to create/load default workspace after Supabase login.
- New helper: `lib/saas/workspace.ts`.
- Onboarding wizard added at `/onboarding`.

## CSV marketplace import
- New API route: `/api/import/marketplace`.
- Supports CSV normalization using existing marketplace parser.
- Creates import job records and AI insight records when Supabase env is configured.
- Has preview mode if Supabase env is not available.

## AI insight generator
- New rule-based AI CFO engine in `lib/saas/aiInsights.ts`.
- Flags product rugi, low stock, expense pressure, fee-heavy products, and scale candidates.

## Realtime
- New helper: `lib/saas/realtime.ts` for workspace-scoped realtime subscriptions.

## UI/product positioning
- SaaS panel updated to v6 Real Data positioning.
- Existing mobile bottom navigation and dark mode preview retained.

## Validation note
- Full `npm install` / `npm run build` was not completed in this sandbox because dependencies are not installed here. Run locally/Vercel after extraction.
