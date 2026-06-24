<div align="center">
  <h1>SMART ATTENDANCE</h1>

  <hr />

  <p>
    Web absensi apel digital untuk Manajemen Informatika dengan validasi GPS,
    selfie langsung, pengajuan izin, dashboard monitoring, dan admin panel.
  </p>

  <p>
    <img alt="React" src="https://img.shields.io/badge/React-19-20232A?style=flat&logo=react&logoColor=61DAFB&labelColor=3B3F46" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-8-20232A?style=flat&logo=vite&logoColor=FFD62E&labelColor=5B5FEF" />
    <img alt="Express" src="https://img.shields.io/badge/Express-5-20232A?style=flat&logo=express&logoColor=FFFFFF&labelColor=555555" />
    <img alt="Prisma" src="https://img.shields.io/badge/Prisma-5-20232A?style=flat&logo=prisma&logoColor=FFFFFF&labelColor=2D3748" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Supabase-20232A?style=flat&logo=postgresql&logoColor=FFFFFF&labelColor=4169E1" />
  </p>
</div>

---

## Tentang Proyek

Smart Attendance adalah aplikasi absensi apel berbasis web yang membantu proses pencatatan kehadiran mahasiswa secara lebih cepat, rapi, dan transparan.

Sistem ini dibuat untuk mengurangi manipulasi presensi dengan menggabungkan validasi lokasi, bukti selfie langsung, waktu server, dan dashboard admin untuk memantau kehadiran saat apel berlangsung.

## Fitur Utama

| Role | Fitur |
| --- | --- |
| Mahasiswa | Login, absensi apel berbasis GPS, selfie langsung, riwayat kehadiran, dan pengajuan izin |
| Admin | Dashboard monitoring, kelola mahasiswa, kelas, jurusan, program studi, jadwal apel, lokasi, dan validasi izin |
| Sistem | Validasi radius lokasi, status terlambat, upload bukti foto, rekap absensi, dan audit aktivitas |

## Tech Stack

| Bagian | Teknologi |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, React Router, Leaflet, React Webcam |
| Backend | Node.js, Express.js, JWT, Multer, ExcelJS |
| Database | PostgreSQL / Supabase |
| ORM | Prisma |
| Tools | Concurrently, Nodemon, Netlify, Vercel |

## Struktur Folder

```text
ABSENSI-APEL/
|-- archive/          # Arsip dan backup pengembangan
|-- backend/          # REST API, Prisma schema, scripts, dan uploads
|-- docs/             # Dokumentasi database, API, maintenance, dan deployment
|-- frontend/         # Aplikasi React, halaman, komponen, dan service API
|-- netlify/          # Konfigurasi deployment Netlify
|-- package.json      # Script root monorepo
```

## Dokumentasi

- [API](docs/API.md) - daftar endpoint dan kontrak request/response.
- [Database](docs/DATABASE.md) - model utama, relasi, dan catatan Prisma.
- [Maintenance](docs/MAINTENANCE.md) - panduan seed, perawatan, dan operasional.
- [Deployment](docs/DEPLOYMENT.md) - panduan rilis ke production.

## Instalasi Lokal

Pastikan perangkat sudah memiliki Node.js dan npm.

1. Install dependency backend dan frontend.

```bash
npm run install:all
```

2. Siapkan file environment backend.

```bash
cp backend/.env.example backend/.env
```

Isi konfigurasi utama berikut:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

3. Siapkan file environment frontend.

```bash
cp frontend/.env.example frontend/.env.local
```

Untuk development lokal, arahkan frontend ke backend lokal:

```env
VITE_API_URL=http://localhost:5000
```

4. Generate Prisma client dan sinkronkan database.

```bash
cd backend
npx prisma generate
npx prisma db push
```

5. Jika database masih kosong, jalankan seed.

```bash
npm run seed
```

## Menjalankan Aplikasi

Jalankan backend dan frontend sekaligus dari folder root:

```bash
npm run dev
```

URL default:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API base path: `/api`

## Script Penting

| Command | Fungsi |
| --- | --- |
| `npm run install:all` | Install dependency backend dan frontend |
| `npm run dev` | Menjalankan backend dan frontend bersamaan |
| `npm run dev:backend` | Menjalankan backend saja |
| `npm run dev:frontend` | Menjalankan frontend saja |
| `npm run start` | Menjalankan backend mode production/start |
| `npm run build:frontend` | Build frontend untuk production |

## Endpoint Ringkas

| Modul | Endpoint Utama |
| --- | --- |
| Auth | `POST /api/login` |
| Mahasiswa | `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id` |
| Absensi | `GET /api/attendance`, `POST /api/attendance/apel`, `GET /api/attendance/stats` |
| Izin | `GET /api/izin`, `POST /api/izin`, `PUT /api/izin/:id/status` |
| Jadwal | `GET /api/jadwal`, `POST /api/jadwal`, `PUT /api/jadwal/:id/status` |
| Lokasi | `GET /api/lokasi`, `POST /api/lokasi`, `PUT /api/lokasi/:id/activate` |

## Fokus Sistem

- Absensi lebih akurat dengan validasi lokasi dan bukti selfie.
- Admin dapat memantau data apel secara langsung dan terstruktur.
- Data akademik, jadwal, lokasi, izin, dan rekap absensi dikelola dalam satu sistem.
- Struktur monorepo memisahkan frontend, backend, dan dokumentasi agar mudah dirawat.

---

<div align="center">
  <strong>Dibuat untuk Manajemen Informatika - Politeknik Negeri Lampung</strong>
  <br />
  Smart Attendance membantu proses apel menjadi lebih cepat, tertib, dan terukur.
</div>
