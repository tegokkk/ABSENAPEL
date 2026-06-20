# Dokumentasi Deployment

## Struktur Aplikasi
Aplikasi ini di-deploy di platform Netlify dengan dua bagian utama:
1. **Frontend:** React + Vite (sebagai static assets).
2. **Backend:** Express API berjalan secara serverless via Netlify Functions.

## Environment Variables Wajib
Di setting dashboard (Netlify/Vercel) atur variable berikut:
- `DATABASE_URL`: URI ke database Supabase (Pooler/Transaction).
- `DIRECT_URL`: URI direct Supabase (untuk migrasi Prisma).
- `JWT_SECRET`: Secret token untuk enkripsi session backend.
- (Opsional) `NODE_ENV`: Diset otomatis ke `production`.

## Perintah Build & Deploy
Pada file `netlify.toml`, perintah build telah diatur secara root:

```toml
[build]
  command = "npm run build:frontend"
  publish = "frontend/dist"
```
*(Catatan: Saat ini, install root dan struktur mungkin membutuhkan penyesuaian jika build failed di cloud).*

### Local Development
Gunakan root package.json helper atau masuki folder masing-masing:

**Backend:**
```bash
cd backend
npm run dev # atau npm start
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Pastikan VITE_API_URL di `frontend/.env.local` menunjuk ke URL lokal server backend (cth: `http://localhost:5000`).

## Serverless Function
Endpoint API dialihkan dari `/api/*` menuju ke direktori `netlify/functions/api.js`. Fungsi tersebut memanfaatkan `serverless-http` yang membungkus express app di `backend/index.js` (atau `backend/src/app.js` setelah refactor).
