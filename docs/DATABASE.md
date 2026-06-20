# Dokumentasi Database & Schema

## Spesifikasi
- **Provider**: PostgreSQL
- **ORM**: Prisma
- **Environment Variables**:
  - `DATABASE_URL`: Connection pooler (contoh: Supabase Transaction mode)
  - `DIRECT_URL`: Direct connection (untuk Prisma migrations)

## Lokasi Schema
Semua definisi schema berada di `backend/prisma/schema.prisma`.

## Model Utama
1. **User**
   - Mengelola data autentikasi (username, password, role).
   - Memiliki relasi ke `Kelas` untuk role `MAHASISWA`.
2. **Attendance**
   - Mencatat log absensi per user.
   - Menyimpan koordinat GPS, jarak dari lokasi (radius), status keterlambatan, dan foto selfie.
   - Relasi opsional ke `JadwalApel`.
3. **Master Data Akademik**
   - **Jurusan**: Entitas tertinggi.
   - **ProgramStudi**: Berelasi ke Jurusan.
   - **Kelas**: Berelasi ke ProgramStudi, referensi utama untuk pengelompokan mahasiswa.
4. **JadwalApel**
   - Jadwal pelaksanaan apel beserta waktu mulai dan selesai.
5. **PengajuanIzin**
   - Menyimpan pengajuan izin mahasiswa beserta lampiran dan status persetujuan.
6. **ActivityLog**
   - Mencatat aktivitas sistem untuk audit (khususnya untuk admin).
7. **Lokasi**
   - Menyimpan titik kordinat kampus/apel beserta radius toleransi.

## Operasi Prisma
- **Generate Client**: `npx prisma generate` (harus dijalankan setelah `npm install`).
- **Migrasi Baru**: `npx prisma migrate dev --name <nama_migrasi>`
- **Push Schema (Tanpa Migrasi)**: `npx prisma db push`
- **Seeding Data**: `npm run seed` (mengeksekusi `backend/scripts/seed.js`)
