<p align="center">
  <img src="./docs/banner.png" alt="SMART ATTENDANCE dashboard banner" width="100%" />
</p>

<h1 align="center">SMART ATTENDANCE</h1>

<p align="center">
  Web absensi apel digital untuk Manajemen Informatika dengan validasi GPS, selfie langsung, pengajuan izin, dashboard monitoring, dan admin panel.
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-20232a?logo=react&logoColor=61dafb" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-5-111111?logo=express&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-5-2d3748?logo=prisma&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Supabase-4169e1?logo=postgresql&logoColor=white" />
</p>

---

## Overview

SMART ATTENDANCE adalah aplikasi full-stack untuk mengelola absensi apel mahasiswa. Frontend dibuat dengan React + Vite, backend memakai Express + Prisma, dan database menggunakan PostgreSQL/Supabase.

Fokus project ini adalah membuat proses presensi lebih tertib dan sulit dimanipulasi: mahasiswa melakukan absensi dengan validasi lokasi dan selfie, sedangkan admin dapat memantau kehadiran, mengelola jadwal, mengatur titik lokasi, memvalidasi izin, dan melihat rekap absensi dari dashboard.

## Fitur

| Modul | Fitur |
| --- | --- |
| Auth | login mahasiswa dan admin dengan JWT |
| Mahasiswa | dashboard, absensi apel, selfie langsung, riwayat kehadiran, pengajuan izin |
| Absensi | validasi radius GPS, status hadir/terlambat, foto bukti, rekap harian |
| Izin | pengajuan izin mahasiswa dan validasi approve/reject oleh admin |
| Jadwal | buat, ubah, hapus, dan aktifkan jadwal apel |
| Lokasi | kelola titik koordinat apel dan radius toleransi |
| Admin | kelola mahasiswa, jurusan, program studi, kelas, settings, dan data absensi |
| Backend | REST API modular, Prisma ORM, upload foto, seed data awal |

## Alur Aplikasi

```mermaid
flowchart LR
  A["Mahasiswa login"] --> B["Dashboard mahasiswa"]
  B --> C["Ambil lokasi GPS"]
  C --> D["Selfie langsung"]
  D --> E["Kirim absensi apel"]
  E --> F["Riwayat kehadiran"]

  G["Admin login"] --> H["Dashboard admin"]
  H --> I["Kelola jadwal dan lokasi"]
  H --> J["Pantau absensi"]
  H --> K["Validasi izin"]
```

## Tech Stack

| Layer | Teknologi |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, Axios, Leaflet, React Webcam |
| Styling | Tailwind CSS 4, Framer Motion, Lucide React, custom UI components |
| Backend | Node.js, Express 5, Prisma Client |
| Database | PostgreSQL / Supabase |
| Auth & Upload | JWT, Bcrypt, CORS, Multer |
| Report & Utility | ExcelJS, jsPDF, jsPDF AutoTable, Concurrently |

## Struktur Folder

```text
ABSENSI-APEL/
|-- backend/
|   |-- prisma/
|   |   `-- schema.prisma
|   |-- scripts/
|   |   |-- seed.js
|   |   |-- check-admin.js
|   |   `-- reset-admin.js
|   |-- src/
|   |   |-- middlewares/
|   |   |-- routes/
|   |   |-- utils/
|   |   `-- app.js
|   |-- uploads/
|   `-- server.js
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- utils/
|-- docs/
|   |-- API.md
|   |-- DATABASE.md
|   |-- DEPLOYMENT.md
|   |-- MAINTENANCE.md
|   `-- banner.png
|-- netlify/
|-- package.json
`-- README.md
```

## Quick Start

### 1. Clone

```bash
git clone https://github.com/tegokkk/ABSENAPEL.git
cd ABSENAPEL
```

### 2. Install Dependency

```bash
npm run install:all
```

### 3. Setup Backend

```bash
cd backend
cp .env.example .env
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Backend berjalan di:

```text
http://localhost:5000
```

### 4. Setup Frontend

Buka terminal baru:

```bash
cd frontend
cp .env.example .env.local
npm run dev
```

Frontend berjalan di:

```text
http://localhost:5173
```

## Environment Backend

Contoh konfigurasi ada di `backend/.env.example`.

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here

DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"

NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

## Environment Frontend

Contoh konfigurasi ada di `frontend/.env.example`.

Untuk development lokal:

```env
VITE_API_URL=http://localhost:5000
```

Untuk production, arahkan `VITE_API_URL` ke URL backend production.

## Akun Development

Jalankan `npm run seed` dari folder `backend` untuk membuat data awal.

| Role | Username | Password |
| --- | --- | --- |
| Admin | `TIMDIS1` | `TIMDIS1` |
| Admin | `TIMDIS2` | `TIMDIS2` |
| Mahasiswa | nama mahasiswa dari seed | NPM masing-masing |

Untuk production, ganti password default dan gunakan `JWT_SECRET` yang kuat.

## Script

### Root

| Command | Fungsi |
| --- | --- |
| `npm run install:all` | install dependency backend dan frontend |
| `npm run dev` | menjalankan backend dan frontend bersamaan |
| `npm run dev:backend` | menjalankan backend saja |
| `npm run dev:frontend` | menjalankan frontend saja |
| `npm run start` | menjalankan backend mode start |
| `npm run build:frontend` | build frontend untuk production |

### Backend

| Command | Fungsi |
| --- | --- |
| `npm run dev` | menjalankan backend dengan Nodemon |
| `npm start` | menjalankan backend |
| `npm run build` | generate Prisma Client |
| `npm run seed` | seed data awal |
| `npm run check:admin` | cek akun admin |
| `npm run reset:admin` | reset akun admin |

### Frontend

| Command | Fungsi |
| --- | --- |
| `npm run dev` | menjalankan Vite dev server |
| `npm run build` | build frontend |
| `npm run preview` | preview hasil build |
| `npm run lint` | menjalankan ESLint |

## API Ringkas

Base URL:

```text
http://localhost:5000/api
```

| Modul | Endpoint |
| --- | --- |
| Auth | `/login` |
| User | `/users`, `/users/:id`, `/users/:id/reset-password` |
| Attendance | `/attendance`, `/attendance/apel`, `/attendance/stats`, `/attendance/:id` |
| Izin | `/izin`, `/izin/:id/status` |
| Jadwal | `/jadwal`, `/jadwal/:id` |
| Lokasi | `/lokasi`, `/lokasi/:id`, `/lokasi/:id/activate` |
| Master Data | `/jurusan`, `/program-studi`, `/kelas` |
| Settings | `/settings` |
| Utility | `/health`, `/seed` |

Endpoint admin membutuhkan token dengan role `ADMIN`.

## Route Frontend

| Route | Halaman |
| --- | --- |
| `/` | login atau redirect sesuai role |
| `/dashboard` | dashboard mahasiswa |
| `/admin` | dashboard admin |

## Testing

Frontend lint:

```bash
cd frontend
npm run lint
```

Frontend build:

```bash
cd frontend
npm run build
```

Backend sanity check:

```bash
cd backend
npm run check:admin
```

## Catatan

- File `.env`, `node_modules`, `dist`, dan upload runtime tidak masuk Git.
- Prisma schema berada di `backend/prisma/schema.prisma`.
- Dokumentasi API lengkap ada di `docs/API.md`.
- Dokumentasi database ada di `docs/DATABASE.md`.
- Foto selfie dan lampiran izin diproses melalui backend.
- Jika login admin gagal, jalankan `npm run seed` atau `npm run reset:admin`.
- Jika absensi gagal, pastikan browser memberi izin akses lokasi dan kamera.

## Deployment

1. Set environment production untuk backend dan frontend.
2. Install dependency di `backend` dan `frontend`.
3. Jalankan `npx prisma generate` dan migrasi/sinkronisasi schema sesuai database production.
4. Build frontend dengan `npm run build`.
5. Deploy backend Node.js dan static frontend sesuai platform hosting.

---

<p align="center">
  SMART ATTENDANCE - absensi apel lebih cepat, tertib, dan terukur.
</p>
