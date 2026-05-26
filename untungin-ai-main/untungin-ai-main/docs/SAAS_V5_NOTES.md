# Untungin.ai v5 - SaaS Indonesia AI-first

Versi ini mengubah app menjadi fondasi SaaS seller operating system untuk market Indonesia.

## Yang ditambahkan

- SaaS command center di Overview.
- Login seller tetap memakai Supabase Auth.
- Marketplace Import Center dengan upload CSV langsung dari tab Marketplace.
- Parser CSV marketplace yang lebih fleksibel untuk Shopee, Tokopedia, TikTok Shop, dan Lazada.
- Perhitungan otomatis HPP, harga jual, quantity, fee admin, biaya iklan, voucher seller, stok, margin, dan profit.
- Download template CSV marketplace.
- Multi-store, RBAC team access, subscription, dan marketplace credential schema di `supabase/production_schema.sql`.
- Dark mode preview toggle di topbar.
- Dashboard tetap mobile responsive dengan bottom navigation.
- AI-first positioning untuk membedakan dari Jubelio/Sirclo/Ginee: fokus insight profit, cashflow, restock, dan fee leak.

## CSV import yang didukung

Kolom fleksibel. Sistem otomatis membaca variasi nama kolom seperti:

- `Marketplace`, `Channel`, `Platform`
- `Nama Produk`, `Nama Barang`, `Product Name`, `Item Name`
- `HPP`, `Modal`, `Harga Modal`, `Cost Price`
- `Harga Jual`, `Total Harga Produk`, `Total Penjualan`, `Settlement Amount`
- `Jumlah`, `Quantity`, `Qty`, `Jumlah Produk`
- `Stok Awal`, `Stock`, `Jumlah Stok`
- `Biaya Admin`, `Biaya Layanan`, `Biaya Iklan`, `Voucher Ditanggung Penjual`, `Affiliate Commission`, `Commission`, `Platform Fee`

## Production setup

1. Jalankan `supabase/production_schema.sql` di Supabase SQL Editor.
2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `MIDTRANS_SERVER_KEY`
   - `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`
3. Deploy ke Vercel.
4. Jika tampilan lama masih muncul, redeploy dengan `Clear build cache`.

## Next step API official

- TikTok Shop: implement OAuth + token refresh + order sync worker.
- Tokopedia: implement partner OAuth + order/settlement import.
- Shopee: official Open Platform butuh approval partner, jadi CSV tetap fallback utama untuk MVP.
