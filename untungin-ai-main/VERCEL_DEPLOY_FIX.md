# Vercel Deploy Fix

Masalah yang terlihat di log Vercel:

```text
npm ERR! code ETIMEDOUT
npm ERR! network request to https://packages.applied-caas-gateway1.internal.api.openai.org/...
Error: Command "npm install" exited with 1
```

Penyebabnya bukan dari source code aplikasi. Vercel/npm sedang mencoba mengambil package dari registry internal, bukan registry publik npm.

Perbaikan yang ditambahkan di ZIP ini:

1. Menambahkan `.npmrc` di root proyek agar npm memakai registry publik:

```text
registry=https://registry.npmjs.org/
always-auth=false
audit=false
fund=false
```

2. Mengubah `vercel.json` agar Vercel menjalankan install eksplisit:

```json
"installCommand": "npm ci --registry=https://registry.npmjs.org/ --prefer-online"
```

## Setelah upload ke GitHub

1. Commit dan push file `.npmrc` dan `vercel.json` ini.
2. Di Vercel, buka project `untungin-ai`.
3. Masuk ke **Settings > Environment Variables**.
4. Kalau ada environment variable bernama `NPM_CONFIG_REGISTRY`, `npm_config_registry`, atau `REGISTRY` yang mengarah ke `packages.applied-caas...`, hapus.
5. Buka **Deployments** lalu klik **Redeploy**.
6. Pilih opsi tanpa cache kalau tersedia: **Redeploy without Build Cache**.

## Catatan

Jika Vercel tetap mencoba registry internal setelah patch ini, berarti registry diset dari level akun/project Vercel, bukan dari repo. Hapus konfigurasi registry tersebut di Vercel Project Settings.
