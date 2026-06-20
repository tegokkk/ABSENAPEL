# API Documentation

Base URL: `/api`

## 1. Auth & Users
- `POST /login`: Autentikasi user. Mengembalikan JWT token.
- `GET /users`: Mengambil list semua mahasiswa (bisa di-filter berdasarkan kelas).
- `POST /users`: Tambah mahasiswa baru.
- `PUT /users/:id`: Edit mahasiswa.
- `DELETE /users/:id`: Hapus mahasiswa (termasuk cascade data terkait).
- `PUT /users/:id/reset-password`: Mengembalikan password mahasiswa ke NPM mereka.

## 2. Master Data Akademik
- `GET /jurusan`, `POST /jurusan`, `DELETE /jurusan/:id`
- `GET /program-studi`, `POST /program-studi`, `DELETE /program-studi/:id`
- `GET /kelas`, `POST /kelas`, `DELETE /kelas/:id`

## 3. Jadwal Apel
- `GET /jadwal`: Mengambil semua jadwal apel.
- `POST /jadwal`: Membuat jadwal apel baru.
- `PUT /jadwal/:id/status`: Mengaktifkan/menonaktifkan jadwal apel.
- `DELETE /jadwal/:id`

## 4. Lokasi & Settings
- `GET /settings`: Mengambil batas waktu terlambat (`BATAS_TERLAMBAT`).
- `PUT /settings`: Mengubah batas waktu terlambat.
- `GET /lokasi`: Mengambil semua titik kordinat absensi apel.
- `POST /lokasi`: Menambah titik absensi baru.
- `PUT /lokasi/:id/activate`: Mengubah titik lokasi aktif yang akan digunakan mahasiswa.
- `DELETE /lokasi/:id`

## 5. Izin
- `GET /izin`: Mengambil semua list izin.
- `POST /izin`: (Mahasiswa) Mengajukan izin baru.
- `PUT /izin/:id/status`: (Admin) Mengubah status pengajuan menjadi APPROVED/REJECTED.

## 6. Attendance (Absensi)
- `GET /attendance`: Menarik data log absensi.
- `POST /attendance/apel`: (Mahasiswa) Melakukan absensi apel. Memerlukan payload GPS dan foto selfie.
- `DELETE /attendance/:id`: Hapus log absensi spesifik.
- `GET /attendance/stats`: Menarik statistik absensi hari ini (Hadir, Terlambat).

## 7. Utility
- `GET /health`: Cek konektivitas database.
- `GET /seed`: (Dev) Trigger seed database (jika script tidak disabled).
