# SOP Maintenance & Skrip Admin

File-file khusus untuk pemeliharaan sistem terletak di dalam `backend/scripts/`.

## 1. check-admin.js
Skrip ini digunakan untuk mengecek apakah akun admin default ada di dalam sistem.
- **Cara Pakai**: `npm run check:admin` (di dalam folder backend).

## 2. reset-admin.js
Skrip ini *force-reset* atau meregenerasi akun Admin default jika Anda terkunci dari sistem (lupa password).
- **Cara Pakai**: `npm run reset:admin`
- **Peringatan**: Pastikan hanya digunakan saat *emergency*. 

## 3. seed.js
Skrip untuk memasukkan (seeding) data awal seperti admin, jurusan, dan lokasi default.
- **Cara Pakai**: `npm run seed`

## Aturan Keamanan Database & Skrip
1. Jangan pernah memasukkan file `.env` ke dalam Git Repository (`.gitignore` sudah mengcover ini).
2. Hindari memanggil `/api/seed` melalui web API di mode production; gunakan `npm run seed` di terminal server jika diperlukan.
