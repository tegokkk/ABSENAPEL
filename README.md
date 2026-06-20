<div align="center">
  <h1>Smart Attendance - Manajemen Informatika</h1>
  <p><strong>Aplikasi Sistem Absensi Apel Digital Berbasis Web Terintegrasi GPS & Pengenalan Wajah</strong></p>
</div>

---

Aplikasi sistem absensi digital ini dirancang khusus untuk program studi Manajemen Informatika. Sistem ini menggunakan metode presensi modern berbasis Geofencing (GPS Radius) serta diwajibkan menggunakan Foto Selfie Langsung (Webcam/Kamera Smartphone). Tujuannya adalah untuk secara signifikan mengurangi tingkat kecurangan (fraud) seperti penggunaan Fake GPS maupun penitipan absen.

## Fitur Utama

### Modul Mahasiswa
- **Presensi Pintar:** Pengecekan jarak lokasi (distance) otomatis. Mahasiswa hanya dapat melakukan absensi apabila berada di dalam radius lokasi apel aktif.
- **Deteksi Akurasi & Waktu Sebenarnya:** Mencegah manipulasi waktu pada perangkat. Server menggunakan waktu internal (GMT) dan mendeteksi indikasi Fake GPS melalui metadata akurasi perangkat.
- **Verifikasi Selfie:** Menangkap wajah secara real-time menggunakan kamera perangkat untuk memastikan kehadiran fisik secara akurat.
- **Histori Kehadiran:** Pemantauan jadwal absensi dan riwayat keterlambatan secara transparan.
- **Pengajuan Izin Digital:** Mahasiswa dapat mengajukan keterangan sakit, izin, atau surat tugas beserta lampiran bukti foto secara terstruktur.

### Modul Admin (TIMDIS)
- **Dashboard Pemantauan (Live):** Pelacakan status kehadiran secara langsung saat jadwal apel aktif, termasuk pratinjau foto selfie mahasiswa.
- **Master Data Dinamis:** Pengelolaan data Jurusan, Program Studi, Kelas, dan Data Mahasiswa secara langsung dari antarmuka Web.
- **Konfigurasi Titik Lokasi:** Pengaturan Koordinat (Latitude, Longitude) dan Radius (Meter) titik kumpul apel. Mendukung sistem multi-lokasi.
- **Validasi Izin:** Proses persetujuan (Approve) atau penolakan (Reject) surat izin mahasiswa dengan antarmuka yang efisien.

## Teknologi

- **Frontend:** React + Vite, Tailwind CSS, Leaflet JS.
- **Backend:** Node.js, Express.js (Modular Architecture).
- **Database:** PostgreSQL (Supabase), Prisma ORM.
- **Arsitektur:** Monorepo terintegrasi (concurrently).

## Struktur Proyek

Proyek ini telah menerapkan Clean Code architecture dan pemisahan komponen.

```bash
ABSENSI-APEL
 |__ archive/      # File backup dan versi lama yang disimpan untuk dokumentasi
 |__ backend/      # Core API Node.js/Express, Prisma Schema, dan Modular Routes
 |__ docs/         # Dokumentasi spesifik (Wajib dibaca oleh Developer)
 |__ frontend/     # UI React, Components, dan API Service Layer
 |__ package.json  # Root NPM Script untuk Monorepo Command
```

Catatan: Jangan lupakan folder docs! Di dalamnya berisi panduan mendalam:
- [DATABASE.md](docs/DATABASE.md): ERD dan Penjelasan Tabel
- [API.md](docs/API.md): Rincian REST Endpoints
- [MAINTENANCE.md](docs/MAINTENANCE.md): Panduan Seed & Perawatan
- [DEPLOYMENT.md](docs/DEPLOYMENT.md): Panduan Rilis ke Production

## Persiapan & Instalasi

Pastikan Anda memiliki Node.js terpasang di sistem.

**1. Clone atau Ekstrak Repository ini.**
Buka terminal dan arahkan ke dalam direktori root proyek (ABSENSI-APEL).

**2. Instalasi Dependensi Semua Layanan**
Jalankan satu baris perintah ini untuk menginstal module di backend maupun frontend:
```bash
npm run install:all
```

**3. Atur Environment Variables**
- Salin `backend/.env.example` ke `backend/.env` dan isi dengan URL PostgreSQL Supabase Anda.
- Salin `frontend/.env.example` ke `frontend/.env.local` (Bila belum ada, sesuaikan VITE_API_URL menunjuk ke URL backend).

**4. Generate Prisma & Migrasi**
```bash
cd backend
npx prisma generate
npx prisma db push
```
(Jika Anda baru mengosongkan database, silakan lakukan seed dengan perintah `npm run seed` dari dalam folder backend)

## Menjalankan Aplikasi Lokal

Kembali ke root direktori proyek (ABSENSI-APEL), kemudian jalankan perintah berikut:

```bash
npm run dev
```

Ini akan menjalankan Backend (Port 5000) dan Frontend (Port 5173) secara bersamaan.
Buka `http://localhost:5173/` di web browser Anda.

---
Dibuat untuk Manajemen Informatika - Mempermudah pemantauan kedisiplinan secara otomatis, real-time, dan meminimalisir manipulasi presensi.
