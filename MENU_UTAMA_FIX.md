# Menu Utama Fix

Menu utama dashboard sudah disederhanakan menjadi:

Dashboard | Integrasi | Trend Produk | Insight AI | Laporan

Perubahan teknis:
- `components/dashboard/AppShell.tsx`: navigasi utama ID/EN/MS diperbarui dan mobile nav mengikuti 5 menu utama.
- `types/dashboard.ts`: menambahkan tab `trends`.
- `app/page.tsx`: memisahkan `Trend Produk` dari `Integrasi` dan `Insight AI`.

Catatan:
- Menu `Integrasi` berisi koneksi/import marketplace.
- Menu `Trend Produk` berisi Marketplace Trend Analyzer dan export CSV riset produk.
- Menu `Insight AI` berisi rekomendasi/action plan berdasarkan data bisnis.
