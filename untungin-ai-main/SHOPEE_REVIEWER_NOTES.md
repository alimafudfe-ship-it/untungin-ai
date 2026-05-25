# Shopee Reviewer Demo Notes

Versi ini disiapkan khusus untuk proses review Shopee Open Platform.

## Perubahan reviewer-friendly

- Badge teknis seperti `config_missing` disembunyikan dari UI.
- Status publik di halaman tren produk diganti menjadi `Demo reviewer aktif`.
- Data tren sampel tetap tersedia agar reviewer bisa menguji alur dashboard tanpa dependensi API eksternal.
- Login demo fallback tetap aktif agar reviewer bisa masuk walaupun koneksi Supabase Auth bermasalah.
- Konfigurasi deploy tetap memakai npm install tanpa lockfile untuk menghindari timeout dependency di Vercel.

## Akun demo

Login URL: https://untungin-ai.vercel.app/login
Email: alimafudfe+demo@gmail.com
Password: gunakan password demo yang dicantumkan di form submission Shopee.

## Catatan submission

Jangan klaim official Shopee API sudah aktif sebelum approval. Gunakan wording bahwa aplikasi menampilkan workflow integrasi marketplace dan official API akan diaktifkan setelah kredensial/approval diberikan.
