# Deployment Guide

Aplikasi Absensi Apel menggunakan arsitektur Monorepo yang kompatibel dengan **Netlify**.

## Struktur Eksekusi
- **Frontend**: React (Vite)
- **Backend**: Express via `serverless-http` yang dijalankan sebagai Netlify Functions (`netlify/functions/api.js`).

## Command Build Local
- Frontend: `npm run dev:frontend` (di root)
- Backend: `npm run dev:backend` (di root)

## Variabel Environment (Wajib diisi di Server/Netlify)
Pastikan hal berikut dikonfigurasi pada dashboard host Anda (contoh Netlify Env):
- `DATABASE_URL` = Koneksi PostgreSQL via Prisma
- `DIRECT_URL` = (Opsional, untuk migrasi)
- `JWT_SECRET` = String rahasia acak
- `FRONTEND_URL` = URL dari aplikasi React Anda (contoh: `https://absensi-apel.netlify.app`)

## Alur Netlify
Berdasarkan `netlify.toml`, aplikasi akan membuild root `package.json` yang akan memicu command Vite build untuk frontend.
Lalu Netlify Functions akan menangkap semua route `/api/*` dan meneruskannya ke file `netlify/functions/api.js` (yang memanggil `backend/src/app.js`).

## Catatan Backend Terpisah
Jika backend di-host terpisah seperti Railway/Render/Nixpacks, gunakan `backend/server.js` sebagai entrypoint dan set `VITE_API_URL` di frontend ke URL backend production.
