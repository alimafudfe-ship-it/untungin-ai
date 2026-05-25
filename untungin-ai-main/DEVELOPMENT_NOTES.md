# Development Notes - Untungin.ai Modern Indonesia v4

## Fokus v4
- Perbaikan final chart label pada kartu **Realtime Revenue vs Expense**.
- Menghapus sumber label lama seperti `D+undefined` dengan label aman `H+1`, `H+5`, `H+10`, dan seterusnya.
- X-axis chart sekarang dirender maksimal 4 tick untuk chart live dan 5 tick untuk forecast, sehingga tidak bertumpuk pada desktop maupun layar kecil.
- `LineChartCard` sekarang punya sanitasi label dan angka supaya chart tetap aman walaupun data marketplace/Supabase kosong, null, atau formatnya berubah.
- Komponen realtime chart diberi key versi baru agar React tidak mempertahankan render chart lama setelah deploy.

## Setelah deploy ke Vercel
1. Upload/deploy isi project v4 ini.
2. Pastikan Vercel build sukses.
3. Buka halaman production lalu hard refresh: `Ctrl + Shift + R`.
4. Jika masih terlihat versi lama, clear site data browser untuk domain tersebut atau redeploy dengan opsi clear build cache di Vercel.

## Catatan validasi
- `npm install` di sandbox mengalami timeout karena dependensi besar/network, jadi build penuh belum sempat divalidasi di sandbox.
- Perubahan v4 hanya menyentuh komponen chart dan label forecast, tidak mengubah database schema atau flow login/payment.
