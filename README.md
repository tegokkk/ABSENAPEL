<div align="center">
  <img src="https://img.icons8.com/color/120/000000/attendance-mark.png" alt="Smart Attendance Logo"/>
  <h1>Smart Attendance - Manajemen Informatika</h1>
  <p><strong>Aplikasi Sistem Absensi Apel Digital Berbasis Web Terintegrasi GPS & Pengenalan Wajah</strong></p>
</div>

---

Aplikasi sistem absensi digital ini dirancang khusus untuk program studi **Manajemen Informatika**. Sistem ini menggunakan metode presensi modern berbasis **Geofencing (GPS Radius)** serta diwajibkan menggunakan **Foto Selfie Langsung (Webcam/Kamera Smartphone)**. Tujuannya adalah untuk secara signifikan mengurangi tingkat kecurangan (_fraud_) seperti penggunaan *Fake GPS* maupun titip absen.

## Fitur Utama

### Modul Mahasiswa
- **Presensi Pintar:** Cek jarak lokasi (_distance_) otomatis. Mahasiswa hanya bisa absen apabila masuk ke dalam radius lokasi apel aktif.
- **Deteksi Akurasi & Waktu Sebenarnya:** Mencegah manipulasi waktu perangkat, server menggunakan waktu GMT sendiri serta mendeteksi pemakaian _Fake GPS_ via metadata akurasi perangkat.
- **Verifikasi Selfie:** Harus menangkap wajah _real-time_ menggunakan kamera perangkat untuk memastikan kehadiran fisik sesungguhnya.
- **Histori Absen:** Pantau jadwal absensi dan riwayat terlambat.
- **Pengajuan Izin Digital:** Mahasiswa dapat dengan mudah mengajukan sakit / izin / surat tugas beserta lampiran foto secara sistematis.

### Modul Admin (TIMDIS)
- **Dashboard Pemantauan (Live):** Lacak status kehadiran secara instan setiap ada jadwal apel aktif. Termasuk preview foto selfie yang tertangkap.
- **Master Data Dinamis:** Atur data **Jurusan**, **Program Studi**, **Kelas**, dan **Data Mahasiswa** dengan mudah dari antarmuka Web tanpa menyentuh *database*.
- **Konfigurasi Titik Lokasi:** Atur _Latitude_, _Longitude_ dan _Radius (Meter)_ titik kumpul apel fleksibel. Mendukung multi-lokasi (tinggal ubah _status active_).
- **Validasi Izin:** Setujui (_Approve_) atau Tolak (_Reject_) surat izin mahasiswa dengan sekali klik.

## Teknologi

- **Frontend:** React + Vite, Tailwind CSS, Leaflet JS.
- **Backend:** Node.js, Express.js (Modular Architecture).
- **Database:** PostgreSQL (Supabase), Prisma ORM.
- **Arsitektur:** Monorepo terintegrasi (`concurrently`).

## Struktur Proyek

Proyek ini telah menerapkan _Clean Code_ architecture dan pemisahan komponen.

```bash
ABSENSI-APEL
 |__ archive/      # File backup dan versi lama yang disimpan untuk dokumentasi
 |__ backend/      # Core API Node.js/Express, Prisma Schema, dan Modular Routes
 |__ docs/         # Dokumentasi spesifik (Wajib dibaca oleh Developer)
 |__ frontend/     # UI React, Components, dan API Service Layer
 |__ package.json  # Root NPM Script untuk Monorepo Command
```

> **Catatan:** Jangan lupakan folder `docs/`! Di dalamnya berisi panduan mendalam:
> - [`DATABASE.md`](docs/DATABASE.md): ERD dan Penjelasan Tabel
> - [`API.md`](docs/API.md): Rincian REST Endpoints
> - [`MAINTENANCE.md`](docs/MAINTENANCE.md): Panduan Seed & Perawatan
> - [`DEPLOYMENT.md`](docs/DEPLOYMENT.md): Panduan Rilis ke Production

## Persiapan & Instalasi

Pastikan Anda memiliki [Node.js](https://nodejs.org/en/) terpasang.

**1. Clone atau Ekstrak Repository ini.**
Buka terminal dan arahkan ke dalam direktori root proyek (`ABSENSI-APEL`).

**2. Instalasi Dependensi Semua Layanan**
Jalankan satu baris perintah ini untuk menginstal module di _backend_ maupun _frontend_:
```bash
npm run install:all
```

**3. Atur Environment Variables**
- Salin `backend/.env.example` ke `backend/.env` dan isi dengan URL PostgreSQL Supabase Anda.
- Salin `frontend/.env.example` ke `frontend/.env.local` (Bila belum ada, sesuaikan `VITE_API_URL` menunjuk ke http://localhost:5000).

**4. Generate Prisma & Migrasi**
```bash
cd backend
npx prisma generate
npx prisma db push
```
_(Jika Anda baru mengosongkan database, silakan lakukan seed dengan perintah `npm run seed` dari dalam folder backend)_

## Menjalankan Aplikasi Lokal

Kembali ke root direktori proyek (`ABSENSI-APEL`), kemudian ketikkan perintah berikut:

```bash
npm run dev
```

Ini akan menjalankan _Backend_ (Port 5000) dan _Frontend_ (Port 5173) secara bersamaan!
Buka `http://localhost:5173/` di peramban Anda.

---
_Dibuat untuk Manajemen Informatika - Mempermudah pemantauan kedisiplinan secara otomatis, real-time, dan meminimalisir penipuan presensi._
