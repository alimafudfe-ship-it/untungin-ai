# TikTok Shop Go Live Review Fix

Email penolakan TikTok meminta bukti bahwa backend Untungin.ai menyimpan data TikTok Shop dengan pola ID resmi:

- Order ID TikTok Shop diawali `57` atau `58`
- Product ID TikTok Shop diawali `17`

## Perubahan yang ditambahkan

1. `lib/integrations/tiktokReviewData.ts`
   - Helper seed data TikTok untuk produk, order, order item, dan sales.
   - Product sample memakai `external_product_id` diawali `17`.
   - Order sample memakai `external_order_id` diawali `57` dan `58`.

2. `app/api/marketplace/tiktok/review-data/route.ts`
   - `POST` untuk membuat data review.
   - `GET` untuk membuka JSON backend dan membuktikan data sudah tersimpan.

3. `app/api/marketplace/tiktok/callback/route.ts`
   - Setelah OAuth TikTok berhasil/diterima, sistem otomatis membuat dataset review TikTok yang jelas dilabeli.

4. `components/dashboard/Step4Panels.tsx`
   - Menambahkan panel **TikTok Go Live Review** dengan tombol:
     - `Buat data review TikTok`
     - `Cek JSON backend`

## Cara pakai untuk video/screenshot review TikTok

1. Deploy ke Vercel.
2. Buka dashboard Untungin.ai > tab Marketplace.
3. Klik **Buat data review TikTok**.
4. Klik **Cek JSON backend**.
5. Tunjukkan pada video/screenshot bahwa JSON berisi:
   - `external_product_id` dimulai `17`
   - `external_order_id` dimulai `57` atau `58`
   - `marketplace` bernilai `tiktok`

Endpoint verifikasi:

```text
/api/marketplace/tiktok/review-data?user_id=<USER_UUID>&workspace_id=<WORKSPACE_UUID>
```

Catatan: data ini adalah seed review agar TikTok dapat memverifikasi backend flow saat belum ada live customer traffic. Setelah app approve, endpoint sync real TikTok dapat diarahkan untuk menyimpan response API live ke kolom yang sama.
