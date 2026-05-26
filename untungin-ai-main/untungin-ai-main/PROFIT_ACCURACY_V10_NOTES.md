# Untungin.ai v10 — Profit Accuracy Engine

## Masalah yang diperbaiki

Setelah v9 import CSV pertama berhasil, halaman Produk bisa menampilkan harga jual sangat kecil, profit negatif besar, dan margin seperti `-45278%`.

Penyebabnya: parser v9 memperlakukan kolom `Harga Jual` sebagai total omzet baris, lalu membaginya dengan `Jumlah`. Padahal template Untungin menggunakan `Harga Jual` sebagai harga satuan per produk.

Contoh salah v9:

- Harga Jual: 89.000
- Jumlah: 12
- Sistem membaca harga satuan: 89.000 / 12 = 7.417
- HPP: 41.000
- Hasil: rugi besar dan margin tidak realistis

## Perbaikan v10

- `Harga Jual`, `Harga Satuan`, `Unit Price`, `Selling Price`, `Harga Barang` dibaca sebagai harga satuan.
- `Total Harga Produk`, `Total Penjualan`, `Settlement Amount`, `Omzet`, dan field total lain dibagi quantity.
- Parser Rupiah diperkuat untuk format Indonesia dan internasional.
- Disediakan SQL repair untuk data lama yang sudah terlanjur ter-import dengan mapping v9.

## Setelah deploy

Kalau sebelumnya sudah upload CSV v9 dan data produk masih salah, jalankan:

```text
supabase/production_v10_import_accuracy_repair.sql
```

Atau hapus produk hasil import lama, lalu import ulang CSV setelah v10 deploy.
