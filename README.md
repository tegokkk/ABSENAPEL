<div align="center">
  <img src="docs/banner.png" alt="Smart Attendance login preview" width="100%" />

  <h1>Smart Attendance - Absensi Apel Digital</h1>
  <p>
    Sistem absensi apel berbasis web untuk Manajemen Informatika dengan validasi GPS,
    selfie langsung, dan dashboard monitoring real-time.
  </p>

  <p>
    <img alt="React" src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=111827" />
    <img alt="Node.js" src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
    <img alt="PostgreSQL" src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
    <img alt="Prisma" src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  </p>
</div>

---

## Tentang Proyek

Smart Attendance adalah aplikasi absensi digital yang dibuat untuk membantu proses apel mahasiswa dan administrasi kehadiran secara lebih rapi, cepat, dan transparan.

Sistem ini memadukan geofencing berbasis GPS, validasi kamera/selfie, pengajuan izin digital, serta dashboard admin untuk memantau kehadiran saat jadwal apel berlangsung.

## Sorotan Fitur

| Area | Fitur |
| --- | --- |
| Mahasiswa | Presensi berbasis radius lokasi, selfie langsung, riwayat kehadiran, dan pengajuan izin/sakit/surat tugas |
| Admin | Dashboard live, validasi izin, kelola mahasiswa, kelas, jurusan, program studi, dan titik lokasi apel |
| Keamanan Presensi | Validasi jarak, akurasi lokasi, waktu server, dan bukti foto untuk mengurangi manipulasi absensi |
| Rekap Data | Data kehadiran lebih mudah dipantau, divalidasi, dan disiapkan untuk kebutuhan laporan |

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Leaflet, React Router
- **Backend:** Node.js, Express.js, Prisma ORM
- **Database:** PostgreSQL / Supabase
- **Tools:** Concurrently, Vercel/Netlify configuration, modular monorepo scripts

## Struktur Proyek

```text
ABSENSI-APEL/
|-- archive/          # Arsip, backup, dan versi lama
|-- backend/          # API Express, Prisma schema, scripts, uploads
|-- docs/             # Dokumentasi teknis dan aset README
|-- frontend/         # UI React, routing, komponen, dan service layer
|-- netlify/          # Konfigurasi deployment Netlify
|-- package.json      # Script root untuk menjalankan monorepo
```

## Dokumentasi

- [Database](docs/DATABASE.md) - desain tabel, relasi, dan catatan skema
- [API](docs/API.md) - daftar endpoint REST dan kontrak data
- [Maintenance](docs/MAINTENANCE.md) - panduan seed, perawatan, dan operasional
- [Deployment](docs/DEPLOYMENT.md) - panduan rilis ke production

## Instalasi Lokal

Pastikan Node.js dan npm sudah tersedia di perangkat.

1. Masuk ke folder root proyek.

```bash
cd ABSENSI-APEL
```

2. Install dependency backend dan frontend.

```bash
npm run install:all
```

3. Siapkan environment variable.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Isi `backend/.env` dengan koneksi PostgreSQL/Supabase, lalu sesuaikan `VITE_API_URL` pada `frontend/.env.local` agar mengarah ke URL backend.

4. Generate Prisma client dan sinkronkan database.

```bash
cd backend
npx prisma generate
npx prisma db push
```

Jika database masih kosong, jalankan seed dari folder `backend`.

```bash
npm run seed
```

## Menjalankan Aplikasi

Dari folder root proyek, jalankan:

```bash
npm run dev
```

Perintah ini menjalankan backend dan frontend secara bersamaan.

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Script Penting

| Command | Fungsi |
| --- | --- |
| `npm run install:all` | Install dependency backend dan frontend |
| `npm run dev` | Menjalankan backend dan frontend bersamaan |
| `npm run dev:backend` | Menjalankan backend saja |
| `npm run dev:frontend` | Menjalankan frontend saja |
| `npm run start` | Menjalankan backend mode start |
| `npm run build:frontend` | Build frontend untuk production |

## Fokus Pengembangan

- Presensi yang lebih sulit dimanipulasi melalui validasi lokasi dan bukti selfie.
- Admin panel yang cepat untuk monitoring apel, validasi izin, dan rekap data.
- Struktur proyek yang mudah dipelihara dengan pemisahan frontend, backend, dan dokumentasi.

---

<div align="center">
  <strong>Dibuat untuk Manajemen Informatika - Politeknik Negeri Lampung</strong>
  <br />
  Mempermudah pemantauan kedisiplinan secara otomatis, real-time, dan terukur.
</div>
