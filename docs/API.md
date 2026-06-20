# Dokumentasi API

Base URL untuk API: `/api`

## Authentication
- `POST /api/login` - Melakukan autentikasi menggunakan username/npm dan password. Mengembalikan token JWT.

## Settings & Konfigurasi
- `GET /api/settings` - Mengambil konfigurasi aplikasi (seperti jam batas terlambat).
- `PUT /api/settings` - Memperbarui konfigurasi aplikasi (Admin only).

## Master Data Akademik
*Hanya dapat diakses dan diubah oleh ADMIN, kecuali GET.*
- `GET/POST/PUT/DELETE /api/jurusan` - Manajemen data Jurusan.
- `GET/POST/PUT/DELETE /api/program-studi` - Manajemen data Program Studi.
- `GET/POST/PUT/DELETE /api/kelas` - Manajemen data Kelas.
- `GET/POST/PUT/DELETE /api/lokasi` - Manajemen lokasi absen valid dan aktivasi titik pusat.

## User Management
- `GET/POST/PUT/DELETE /api/users` - CRUD data pengguna (Admin & Mahasiswa).
- `PUT /api/users/:id/reset-password` - Melakukan reset password mahasiswa ke default (sama dengan NPM).

## Jadwal & Izin
- `GET/POST/PUT/DELETE /api/jadwal` - Manajemen jadwal apel. Validasi absen mengecek apakah ada jadwal aktif pada rentang waktu tersebut.
- `POST /api/izin` - Mahasiswa mengajukan izin (Sakit/Izin/Surat Tugas) dengan opsi upload gambar.
- `GET /api/izin` - List pengajuan izin. Mahasiswa hanya melihat miliknya, Admin melihat semuanya.
- `PUT /api/izin/:id/status` - Admin mengubah status izin (APPROVED/REJECTED).

## Attendance (Absensi)
- `POST /api/attendance/apel` - Mahasiswa melakukan absensi. Wajib mengirim payload GPS dan foto selfie base64. Divalidasi dengan radius lokasi aktif.
- `GET /api/attendance` - Mendapatkan daftar absensi (filter by kelas bagi Admin).
- `GET /api/attendance/stats` - Statistik hari ini (Total hadir, terlambat, rekapitulasi kelas).
- `DELETE /api/attendance/:id` - Hapus histori absensi tertentu (Admin only).

## Health & System
- `GET /api/health` - Pengecekan server aktif dan validasi koneksi ke database.
- `GET /api/seed` - Endpoint reset & seed dummy data (Tidak disarankan di-expose di Production).
