# Untungin.ai v10 — Profit Accuracy Engine

AI Profit OS untuk seller Indonesia. v10 memperbaiki akurasi import CSV supaya `Harga Jual` dari template Untungin dibaca sebagai harga satuan, bukan total baris. Ini mencegah harga jual terbagi jumlah produk dan margin/profit menjadi minus tidak realistis.

## Fokus v10

- Import CSV lebih akurat untuk template Untungin, Shopee, Tokopedia, TikTok Shop, dan Lazada.
- `Harga Jual`, `Harga Satuan`, `Unit Price`, `Selling Price`, dan `Harga Barang` dibaca sebagai harga satuan.
- `Total Harga Produk`, `Total Penjualan`, `Settlement Amount`, `Omzet`, dan field total lain dibagi quantity untuk mendapat harga satuan.
- Parser nominal Rupiah lebih tahan format `18.000`, `18,000`, `Rp18.000,00`, dan `IDR 18,000.00`.
- SQL repair disediakan untuk memperbaiki hasil import v9 yang sudah terlanjur masuk.

## Setelah deploy v10

1. Upload ke GitHub.
2. Tunggu Vercel deploy.
3. Jalankan SQL opsional kalau sebelumnya sudah import CSV v9 dan harga/margin terlihat aneh:

```text
supabase/production_v10_import_accuracy_repair.sql
```

4. Re-import CSV jika perlu.

## ENV minimum

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYMENT_PROVIDER=manual
NEXT_PUBLIC_PAYMENT_PROVIDER=manual
```
