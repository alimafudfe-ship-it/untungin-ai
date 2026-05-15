# Untungin.ai Modern Indonesia - Iterasi UI v2

Perubahan utama dari screenshot terbaru:

- Memperbaiki bug label grafik `D+undefined` pada panel Realtime Revenue vs Expense.
- Mengurangi label sumbu X pada grafik agar tidak saling menumpuk.
- Menambahkan area gradient pada line chart agar dashboard terasa lebih premium.
- Memperbaiki kartu Live Dashboard dengan copy yang lebih actionable untuk owner toko Indonesia.
- Menjaga mode demo tetap aman saat Supabase ENV belum diset.

Catatan build:

- `package-lock.json` tidak disertakan agar Vercel / local install membuat lockfile baru sesuai `package.json`.
- Jalankan `npm install`, lalu `npm run dev` untuk preview lokal.
