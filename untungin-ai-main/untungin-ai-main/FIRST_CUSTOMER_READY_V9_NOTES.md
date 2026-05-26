# Untungin.ai v9 — First Customer Ready

v9 menggeser fokus dari tampilan premium ke pengalaman user pertama yang benar-benar bisa dipakai seller Indonesia.

## Fokus utama

1. Onboarding dashboard tidak lagi kosong saat data masih Rp0.
2. Import CSV menjadi jalur aktivasi utama.
3. Setelah import, sistem membuat produk, order, order items, import job, activation event, dan AI insights.
4. Dashboard kembali membaca data workspace real.
5. Billing manual mencatat request upgrade ke tabel `billing_requests` ketika `PAYMENT_PROVIDER=manual`.
6. First Customer Ready panel memandu user dari workspace → toko → import CSV → AI action pertama.

## SQL tambahan opsional

Jalankan setelah v6, v7, v8:

```sql
supabase/production_v9_first_customer_ready_schema.sql
```

Kalau v8 sudah berjalan, v9 tetap bisa dipakai tanpa SQL ini, tetapi schema v9 menambah checkpoint onboarding yang berguna untuk aktivasi user pertama.

## ENV minimal production

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYMENT_PROVIDER=manual
NEXT_PUBLIC_PAYMENT_PROVIDER=manual
```

## Alur test setelah deploy

1. Login.
2. Pastikan workspace otomatis dibuat.
3. Buka Overview.
4. Klik Import CSV pertama.
5. Upload template CSV.
6. Cek dashboard berubah dari Rp0.
7. Buka AI Insight untuk melihat action plan otomatis.
8. Klik Upgrade PRO dan pastikan manual billing request tercatat di `billing_requests`.
