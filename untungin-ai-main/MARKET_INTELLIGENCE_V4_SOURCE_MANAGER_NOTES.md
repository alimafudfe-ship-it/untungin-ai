# Market Intelligence V4 Source Manager Notes

V4 menambahkan kemampuan menyimpan link marketplace langsung dari tab Market Intel -> Import/Admin.

## Fitur baru

- Form input link marketplace di Import/Admin.
- API `GET/POST /api/market-intelligence/sources`.
- Tabel Supabase `market_intelligence_sources`.
- Migration `supabase/migrations/20260524_market_intelligence_sources_v4.sql`.
- Source link ikut dibaca oleh bundle Market Intelligence.
- Template CSV source link: `public/template-marketplace-source-links-v4.csv`.

## ENV tambahan untuk simpan link

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
MARKET_INTELLIGENCE_ADMIN_TOKEN=token-rahasia-kamu
```

`SUPABASE_SERVICE_ROLE_KEY` hanya dipakai server API. Jangan taruh di frontend.

## Catatan legal

Fitur ini tidak scraping otomatis. Link disimpan sebagai referensi/antrean riset agar data bisa diisi dari riset manual, CSV/JSON, API resmi, atau partner feed.
