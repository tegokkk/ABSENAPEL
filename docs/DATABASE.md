# Dokumentasi Database

## Ringkasan
- **Provider:** PostgreSQL (melalui Supabase).
- **ORM:** Prisma.
- **Environment Variables:** `DATABASE_URL` (untuk koneksi pooler) dan `DIRECT_URL` (untuk koneksi direct/migrasi).
- **Lokasi Schema:** `backend/prisma/schema.prisma`

## Model Utama
- **User:** Mengelola data Mahasiswa dan Admin. Memiliki kolom `role`, `npm`, `kelas`, dan berelasi dengan `Kelas` via `kelasId`.
- **Attendance:** Data riwayat absensi apel harian.
- **LokasiAbsen:** Konfigurasi lokasi utama apel (latitude, longitude, radius).
- **Settings:** Konfigurasi dinamis aplikasi (contoh: `BATAS_TERLAMBAT`).
- **Jurusan & ProgramStudi:** Master data akademik hierarkis.
- **Kelas:** Entitas kelas tempat pengguna ditugaskan.
- **JadwalApel:** Manajemen jadwal spesifik dengan batas waktu.
- **PengajuanIzin:** Sistem izin bagi mahasiswa yang tidak dapat menghadiri apel.
- **ActivityLog:** Log untuk audit aksi admin.

## Manajemen Migrasi
Setiap perubahan pada file `schema.prisma` perlu diikuti dengan migrasi:

```bash
cd backend
npx prisma migrate dev --name deskripsi_migrasi
```

Jika tidak ingin menyimpan file migrasi secara lokal dan mem-push secara langsung (misal di environment production/live):
```bash
npx prisma db push
```

## Data Seeding
Seeding awal (untuk reset & dummy data):
```bash
cd backend
npm run seed
```
**Perhatian:** Menjalankan script ini akan menghapus data absensi, data izin, dan user mahasiswa/admin sebelumnya lalu membuat dummy data untuk pengujian. Disarankan hanya di environment development.
