# Untungin.ai v11 Auto Mapping + Import Preview

v11 dibuat setelah v10 berhasil memperbaiki akurasi `Harga Jual`. Masalah berikutnya untuk marketplace Indonesia adalah format CSV berbeda-beda dan punya kolom biaya yang tidak konsisten.

## Yang ditambahkan

- Preview sebelum import masuk database.
- Auto detect Shopee, Tokopedia, TikTok Shop, Lazada, atau CSV manual.
- Mapping otomatis untuk:
  - harga jual satuan
  - total harga produk / omzet
  - settlement / dana diterima
  - HPP / modal
  - qty
  - biaya admin
  - biaya layanan
  - komisi marketplace
  - voucher/diskon seller
  - subsidi ongkir seller
  - ongkir dibayar pembeli
  - pajak/PPN
  - biaya iklan
  - affiliate commission
- Confidence score dan warning.
- Ongkir pembeli diperlakukan sebagai informasi, bukan pengurang profit.

## UX baru

Upload CSV → sistem membaca header → muncul modal preview → user cek omzet, profit, biaya seller, mapping kolom, dan warning → Confirm import.

## Next v12

Manual override mapping kolom per user + simpan mapping profile per marketplace/store.
