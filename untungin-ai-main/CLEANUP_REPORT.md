# Cleanup Report

Project cleaned for GitHub Desktop import.

## Removed from root/archive
- `upgrade/` duplicate full copy of project.
- Loose root `admin/`, `api/`, `login/`, `auth/` folders that duplicated App Router paths under `app/`.
- Loose root `.ts` / `.tsx` files such as `page (1).tsx`, `route (11).ts`, `AdvancedPanels.tsx`, `Charts.tsx`, etc. These were duplicate or misplaced copies of files already under `app/`, `components/`, `lib/`, or `supabase/`.
- Root SVG/favicon copies already stored in `public/` or `app/`.
- Nested archive `untungin-ai-step3-ai-marketplace-forecast.zip`.
- `tsconfig.tsbuildinfo` and `download` artifact.
- Root SQL copies that already exist in `supabase/` or `supabase/migrations/`.

## Kept
- Canonical Next.js App Router source: `app/`.
- Shared UI/components: `components/`.
- Business logic/integrations: `lib/`.
- Types: `types/`.
- Supabase schemas/migrations: `supabase/`.
- Public assets/templates: `public/`.
- Package/config files required for install/build.
- Historical notes moved into `docs/`.

## Recommended GitHub Desktop flow
1. Extract this ZIP.
2. Open GitHub Desktop.
3. Add the extracted folder as a local repository, or copy its contents into your existing repo.
4. Run `npm install`.
5. Run `npm run dev`.
6. Set required `.env.local` values before testing marketplace/payment integrations.
