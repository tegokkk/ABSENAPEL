# Plan Implementasi Perapihan Struktur Folder

Dokumen ini adalah plan cleanup terbaru setelah audit ulang struktur proyek
`ABSENSI-APEL`. Audit dilakukan setelah penambahan fitur baru di backend,
frontend, dan Prisma schema.

## Tujuan

- Merapihkan struktur proyek tanpa memutus fitur yang baru ditambahkan.
- Memisahkan domain backend: auth, settings, lokasi, master data, jadwal, izin,
  absensi, laporan, dan maintenance.
- Merapihkan frontend agar page besar tidak menampung semua logic UI dan API.
- Menjaga kompatibilitas Netlify Functions yang masih memakai
  `backend/index.js` sebagai Express app.
- Membuat dokumentasi database, API, deployment, dan maintenance lebih jelas.

## Kondisi Struktur Saat Ini

Struktur aktual yang ditemukan:

```text
ABSENSI-APEL/
|-- .agents/
|-- .git/
|-- .qodo/
|-- .vercel/
|-- backend/
|   |-- prisma/
|   |   |-- migrations/
|   |   |   |-- 20260611051821_add_lokasi_absen/
|   |   |   |-- 20260620081737_update_skalabilitas/
|   |   |   `-- migration_lock.toml
|   |   `-- schema.prisma
|   |-- uploads/
|   |-- check-admin.js
|   |-- index.js
|   |-- nixpacks.toml
|   |-- package.json
|   |-- package-lock.json
|   |-- reset-admin.js
|   |-- seed.js
|   `-- skills-lock.json
|-- docs/
|   `-- STRUCTURE_CLEANUP_PLAN.md
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |   `-- admin/
|   |   |       |-- TabIzin.jsx
|   |   |       |-- TabJadwal.jsx
|   |   |       `-- TabMasterData.jsx
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- App.css
|   |   |-- App.jsx
|   |   |-- index.css
|   |   `-- main.jsx
|   |-- package.json
|   |-- package-lock.json
|   |-- vite.config.js
|   `-- index.html
|-- netlify/
|   `-- functions/
|       `-- api.js
|-- node_modules/
|-- RND-Final-Project-SQL2/
|-- .gitignore
|-- netlify.toml
|-- package.json
|-- package-lock.json
`-- README.md
```

## Fitur Baru yang Harus Diakomodasi

Schema Prisma sekarang tidak hanya memuat absensi dasar, tetapi juga domain baru:

- `Jurusan`
- `ProgramStudi`
- `Kelas`
- `JadwalApel`
- `PengajuanIzin`
- `ActivityLog`
- Relasi baru `User.kelasId`
- Relasi baru `Attendance.jadwalId`

Route backend yang sekarang ada:

- `POST /api/login`
- `GET/PUT /api/settings`
- CRUD `/api/lokasi`
- CRUD `/api/jurusan`
- CRUD `/api/program-studi`
- CRUD `/api/kelas`
- CRUD `/api/users`
- `PUT /api/users/:id/reset-password`
- CRUD `/api/jadwal`
- `POST/GET /api/izin`
- `PUT /api/izin/:id/status`
- `POST /api/attendance/apel`
- `GET/DELETE /api/attendance`
- `GET /api/attendance/stats`
- `GET /api/seed`
- `GET /api/health`

Frontend sekarang punya komponen admin baru:

- `frontend/src/components/admin/TabMasterData.jsx`
- `frontend/src/components/admin/TabJadwal.jsx`
- `frontend/src/components/admin/TabIzin.jsx`

Script backend tambahan:

- `backend/check-admin.js`
- `backend/reset-admin.js`

## Masalah Struktur yang Perlu Dirapihkan

- `backend/index.js` sudah terlalu besar dan menampung semua route, helper,
  middleware, Prisma client, serta local server runner.
- Logic API frontend masih tersebar di page dan komponen tab.
- `AdminDashboard.jsx` masih menjadi pusat terlalu banyak fitur.
- `UserDashboard.jsx` berisi absensi, kamera, GPS, izin, API call, dan UI dalam
  satu file besar.
- Script maintenance admin berada langsung di root backend.
- `RND-Final-Project-SQL2/` masih berada di root dan terlihat seperti arsip atau
  eksperimen terpisah.
- `README.md` masih template React/Vite.
- Dokumentasi API, database, deploy, dan maintenance belum dipisahkan.
- `.gitignore` sudah cukup baik, tetapi folder upload bisa lebih aman dengan
  pola `.gitkeep`.

## Struktur Target Rekomendasi

```text
ABSENSI-APEL/
|-- backend/
|   |-- prisma/
|   |   |-- migrations/
|   |   `-- schema.prisma
|   |-- scripts/
|   |   |-- check-admin.js
|   |   |-- reset-admin.js
|   |   `-- seed.js
|   |-- src/
|   |   |-- app.js
|   |   |-- server.js
|   |   |-- prisma.js
|   |   |-- config/
|   |   |   `-- env.js
|   |   |-- middleware/
|   |   |   |-- auth.js
|   |   |   `-- error.js
|   |   |-- routes/
|   |   |   |-- auth.routes.js
|   |   |   |-- settings.routes.js
|   |   |   |-- lokasi.routes.js
|   |   |   |-- master-data.routes.js
|   |   |   |-- users.routes.js
|   |   |   |-- jadwal.routes.js
|   |   |   |-- izin.routes.js
|   |   |   |-- attendance.routes.js
|   |   |   |-- seed.routes.js
|   |   |   `-- health.routes.js
|   |   |-- services/
|   |   |   |-- auth.service.js
|   |   |   |-- settings.service.js
|   |   |   |-- lokasi.service.js
|   |   |   |-- master-data.service.js
|   |   |   |-- users.service.js
|   |   |   |-- jadwal.service.js
|   |   |   |-- izin.service.js
|   |   |   |-- attendance.service.js
|   |   |   `-- activity-log.service.js
|   |   `-- utils/
|   |       |-- distance.js
|   |       |-- ip.js
|   |       `-- time.js
|   |-- uploads/
|   |   `-- .gitkeep
|   |-- index.js
|   |-- package.json
|   |-- package-lock.json
|   |-- .env.example
|   `-- nixpacks.toml
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |   |-- admin/
|   |   |   |-- common/
|   |   |   |-- attendance/
|   |   |   `-- izin/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- services/
|   |   |   |-- apiClient.js
|   |   |   |-- authApi.js
|   |   |   |-- attendanceApi.js
|   |   |   |-- izinApi.js
|   |   |   |-- jadwalApi.js
|   |   |   |-- lokasiApi.js
|   |   |   |-- masterDataApi.js
|   |   |   |-- settingsApi.js
|   |   |   `-- usersApi.js
|   |   |-- utils/
|   |   |   |-- browserInfo.js
|   |   |   |-- exportExcel.js
|   |   |   |-- exportPdf.js
|   |   |   `-- formatters.js
|   |   |-- App.jsx
|   |   |-- App.css
|   |   |-- index.css
|   |   `-- main.jsx
|   |-- package.json
|   |-- package-lock.json
|   |-- vite.config.js
|   `-- index.html
|
|-- netlify/
|   `-- functions/
|       `-- api.js
|
|-- docs/
|   |-- STRUCTURE_CLEANUP_PLAN.md
|   |-- DATABASE.md
|   |-- API.md
|   |-- DEPLOYMENT.md
|   `-- MAINTENANCE.md
|
|-- archive/
|   `-- RND-Final-Project-SQL2/
|
|-- .gitignore
|-- README.md
|-- package.json
|-- package-lock.json
`-- netlify.toml
```

## Prinsip Implementasi

- Jangan refactor semua sekaligus.
- Jangan menghapus `backend/index.js`; ubah menjadi compatibility entrypoint.
- Jangan memindahkan `netlify/functions/api.js` sebelum deployment flow dipastikan.
- Jangan menjalankan seed/reset admin tanpa persetujuan eksplisit karena dapat
  mengubah data database.
- Utamakan perubahan non-breaking sebelum memecah route besar.
- Setiap batch refactor harus diikuti build/test smoke.

## Tahap 1: Cleanup Non-Breaking

Tahap ini tidak mengubah behavior aplikasi.

Checklist:

- [ ] Buat folder `archive/`.
- [ ] Pindahkan `RND-Final-Project-SQL2/` ke
      `archive/RND-Final-Project-SQL2/`.
- [ ] Pastikan tidak ada import dari aplikasi aktif ke `RND-Final-Project-SQL2/`.
- [ ] Buat `backend/uploads/.gitkeep`.
- [ ] Update `.gitignore` dari `backend/uploads/` menjadi:

```gitignore
backend/uploads/*
!backend/uploads/.gitkeep
```

- [ ] Buat folder `backend/scripts/`.
- [ ] Pindahkan script maintenance:
  - `backend/check-admin.js` ke `backend/scripts/check-admin.js`
  - `backend/reset-admin.js` ke `backend/scripts/reset-admin.js`
  - opsional: `backend/seed.js` ke `backend/scripts/seed.js`
- [ ] Jika `seed.js` dipindah, update dokumentasi dan script package.
- [ ] Update `README.md` agar menggambarkan aplikasi Smart Attendance, bukan
      template React/Vite.

## Tahap 2: Dokumentasi Wajib

Buat atau lengkapi dokumentasi berikut:

- [ ] `docs/DATABASE.md`
- [ ] `docs/API.md`
- [ ] `docs/DEPLOYMENT.md`
- [ ] `docs/MAINTENANCE.md`

Isi minimal `docs/DATABASE.md`:

- Provider: PostgreSQL melalui Prisma.
- Env yang dipakai: `DATABASE_URL` dan `DIRECT_URL`.
- Lokasi schema: `backend/prisma/schema.prisma`.
- Daftar model lama dan baru.
- Catatan relasi `User.kelasId` dan `Attendance.jadwalId`.
- Cara generate Prisma Client.
- Cara membuat migration baru.
- Cara menjalankan seed dengan aman.

Isi minimal `docs/API.md`:

- Auth.
- Settings.
- Lokasi absen.
- Master data akademik:
  - Jurusan
  - Program Studi
  - Kelas
- Users.
- Jadwal apel.
- Pengajuan izin.
- Attendance.
- Health check.

Isi minimal `docs/DEPLOYMENT.md`:

- Local development backend.
- Local development frontend.
- Netlify build command saat ini.
- Netlify redirects `/api/*`.
- Catatan bahwa `netlify/functions/api.js` masih require `backend/index.js`.
- Environment variable yang wajib.

Isi minimal `docs/MAINTENANCE.md`:

- Fungsi `check-admin.js`.
- Fungsi `reset-admin.js`.
- Risiko reset password admin.
- Cara menjalankan script maintenance.
- Larangan commit `.env`.

## Tahap 3: Rapikan Root dan Package Scripts

Root `package.json` masih dipakai untuk bundling Netlify Functions karena root
dependency berisi Express, Prisma, bcrypt, JWT, dan serverless-http.

Checklist:

- [ ] Jangan hapus root `package.json` dan `package-lock.json` dulu.
- [ ] Tambahkan script helper di root bila diperlukan:

```json
{
  "scripts": {
    "dev:frontend": "npm --prefix frontend run dev",
    "dev:backend": "npm --prefix backend run start",
    "build:frontend": "npm --prefix frontend run build",
    "build:backend": "npm --prefix backend run build"
  }
}
```

- [ ] Di `backend/package.json`, tambahkan script eksplisit:

```json
{
  "scripts": {
    "start": "node index.js",
    "build": "npx prisma generate",
    "seed": "node scripts/seed.js",
    "check:admin": "node scripts/check-admin.js",
    "reset:admin": "node scripts/reset-admin.js"
  }
}
```

Sesuaikan path jika `seed.js` tetap berada di root backend.

## Tahap 4: Backend Refactor Aman

Refactor backend dilakukan bertahap dengan mempertahankan API contract.

### 4.1 Entry Point

- [ ] Buat `backend/src/app.js` untuk Express app.
- [ ] Buat `backend/src/server.js` untuk local `app.listen`.
- [ ] Ubah `backend/index.js` menjadi compatibility entrypoint:

```js
module.exports = require("./src/app");
```

Jika masih perlu local server dari `index.js`, pastikan logika serverless tetap
aman dan tidak double-listen.

### 4.2 Shared Backend Modules

- [ ] Buat `backend/src/prisma.js`.
- [ ] Pindahkan auth middleware ke `backend/src/middleware/auth.js`.
- [ ] Buat error handler di `backend/src/middleware/error.js`.
- [ ] Pindahkan helper jarak ke `backend/src/utils/distance.js`.
- [ ] Pindahkan helper IP ke `backend/src/utils/ip.js`.
- [ ] Pindahkan helper waktu/status terlambat ke `backend/src/utils/time.js`.
- [ ] Buat `backend/src/services/activity-log.service.js`.

### 4.3 Routes Per Domain

Pecah route secara domain:

- [ ] `auth.routes.js`: login dan token payload.
- [ ] `settings.routes.js`: settings dan batas terlambat.
- [ ] `lokasi.routes.js`: lokasi absen dan aktivasi lokasi.
- [ ] `master-data.routes.js`: jurusan, program studi, kelas.
- [ ] `users.routes.js`: mahasiswa/admin user management dan reset password.
- [ ] `jadwal.routes.js`: jadwal apel.
- [ ] `izin.routes.js`: pengajuan izin dan approval.
- [ ] `attendance.routes.js`: absen apel, list, delete, stats.
- [ ] `seed.routes.js`: seed endpoint. Pertimbangkan untuk menonaktifkan di
      production.
- [ ] `health.routes.js`: health check dan DB check.

### 4.4 Services Per Domain

Pindahkan logic Prisma dari route ke service:

- [ ] `master-data.service.js` untuk `Jurusan`, `ProgramStudi`, `Kelas`.
- [ ] `jadwal.service.js` untuk `JadwalApel`.
- [ ] `izin.service.js` untuk `PengajuanIzin`.
- [ ] `attendance.service.js` untuk validasi lokasi, jadwal aktif, dan insert
      absensi.
- [ ] `users.service.js` untuk CRUD mahasiswa.
- [ ] `lokasi.service.js` untuk active/default location.
- [ ] `settings.service.js` untuk `BATAS_TERLAMBAT`.

Catatan penting:

- Pertahankan response JSON yang dipakai frontend.
- Jangan ubah nama endpoint saat cleanup.
- Tambahkan validasi sebelum delete data master yang masih dipakai relasi.
- `GET /api/seed` sebaiknya dipindah ke script atau dibatasi hanya non-production.

## Tahap 5: Frontend Refactor Bertahap

Frontend sudah mulai lebih baik karena tab admin baru sudah dipindah ke
`components/admin/`. Tahap berikutnya adalah memisahkan API client, util, dan
komponen besar.

### 5.1 API Services

Buat `frontend/src/services/`:

- [ ] `apiClient.js`: konfigurasi axios, base URL, auth header.
- [ ] `authApi.js`
- [ ] `attendanceApi.js`
- [ ] `izinApi.js`
- [ ] `jadwalApi.js`
- [ ] `lokasiApi.js`
- [ ] `masterDataApi.js`
- [ ] `settingsApi.js`
- [ ] `usersApi.js`

Target:

- Tidak ada lagi duplikasi `const API = ...`, `token()`, dan `headers()` di
  banyak file.
- Semua request API lewat service layer.

### 5.2 Admin Components

Pertahankan:

- `components/admin/TabMasterData.jsx`
- `components/admin/TabJadwal.jsx`
- `components/admin/TabIzin.jsx`

Tambahkan pemecahan berikut bila file makin besar:

```text
frontend/src/components/admin/
|-- master-data/
|   |-- JurusanPanel.jsx
|   |-- ProgramStudiPanel.jsx
|   `-- KelasPanel.jsx
|-- jadwal/
|   |-- JadwalForm.jsx
|   `-- JadwalTable.jsx
`-- izin/
    |-- IzinTable.jsx
    `-- IzinImageModal.jsx
```

### 5.3 User Dashboard

Pecah `UserDashboard.jsx` menjadi:

```text
frontend/src/components/attendance/
|-- AttendanceHistory.jsx
|-- CameraCapture.jsx
|-- LocationMap.jsx
`-- TodayAttendanceCard.jsx

frontend/src/components/izin/
|-- IzinFormModal.jsx
`-- IzinHistory.jsx
```

Pindahkan helper:

- [ ] `parseBrowserInfo()` ke `frontend/src/utils/browserInfo.js`.
- [ ] Format tanggal/waktu ke `frontend/src/utils/formatters.js`.
- [ ] Logic export Excel ke `frontend/src/utils/exportExcel.js`.
- [ ] Logic export PDF ke `frontend/src/utils/exportPdf.js`.

## Tahap 6: Database dan Migration Cleanup

Checklist:

- [ ] Pastikan migration `20260620081737_update_skalabilitas` sudah diterapkan
      di database target.
- [ ] Jalankan `npx prisma generate` setelah schema berubah.
- [ ] Cek apakah kolom lama `User.kelas` masih dipakai bersama `kelasId`.
- [ ] Buat keputusan migrasi data:
  - Opsi A: pertahankan `kelas` string untuk backward compatibility.
  - Opsi B: migrasikan sepenuhnya ke `kelasId` setelah semua frontend/backend
    membaca relasi `kelasRef`.
- [ ] Pastikan `PengajuanIzin.jenis_izin` konsisten antara frontend dan backend.
      Frontend memakai nilai seperti `Sakit`, sementara schema comment memakai
      `SAKIT`, `IZIN`, `CUTI`.
- [ ] Pastikan `Attendance.jadwalId` diisi saat absen jika fitur jadwal aktif
      memang wajib.
- [ ] Tentukan apakah `ActivityLog` akan dipakai aktif di semua mutation.

## Tahap 7: Verifikasi Setelah Setiap Batch

Backend:

```bash
cd backend
npm run build
npm start
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
```

Smoke test endpoint:

```text
GET /api/health
POST /api/login
GET /api/settings
GET /api/lokasi
GET /api/jurusan
GET /api/program-studi
GET /api/kelas
GET /api/users
GET /api/jadwal
GET /api/izin
GET /api/attendance
GET /api/attendance/stats
```

Checklist manual:

- [ ] Login admin berhasil.
- [ ] Login mahasiswa berhasil.
- [ ] Admin dapat membuka tab Absensi.
- [ ] Admin dapat membuka tab Master Data.
- [ ] Admin dapat membuka tab Jadwal.
- [ ] Admin dapat membuka tab Izin.
- [ ] CRUD lokasi tetap berjalan.
- [ ] CRUD jurusan/prodi/kelas tetap berjalan.
- [ ] CRUD jadwal tetap berjalan.
- [ ] Mahasiswa dapat mengajukan izin.
- [ ] Admin dapat approve/reject izin.
- [ ] Mahasiswa dapat absen dengan GPS dan selfie.
- [ ] Data absensi tampil di admin.
- [ ] Export Excel/PDF tetap berjalan.
- [ ] Netlify function tetap bisa memanggil Express app.

## Risiko dan Mitigasi

Risiko:

- Netlify function gagal karena path `backend/index.js` berubah.
- Import frontend rusak setelah komponen/API service dipindah.
- Data master tidak bisa dihapus karena relasi database.
- `GET /api/seed` dapat menghapus data production jika tidak dilindungi.
- Script `reset-admin.js` bisa mengubah password admin tanpa sengaja.
- Perbedaan format `jenis_izin` membuat filter/status tidak konsisten.
- `kelas` string dan `kelasId` bisa divergen jika keduanya dipakai bersamaan.

Mitigasi:

- Pertahankan `backend/index.js` sebagai compatibility layer.
- Refactor per domain, bukan semua file sekaligus.
- Tambahkan guard production untuk seed/reset.
- Gunakan service API frontend agar endpoint tidak tersebar.
- Dokumentasikan script maintenance.
- Lakukan smoke test setelah setiap batch.
- Jangan ubah response API sampai frontend sudah disesuaikan.

## Prioritas Eksekusi

1. Non-breaking cleanup: `archive/`, `.gitkeep`, `backend/scripts/`, README.
2. Dokumentasi: database, API, deployment, maintenance.
3. Frontend API service layer, karena ini mengurangi duplikasi tanpa mengubah UI.
4. Backend shared modules: Prisma, auth middleware, utils.
5. Backend route split per domain.
6. Backend service split per domain.
7. Pecah `UserDashboard.jsx` dan tab admin yang mulai besar.
8. Evaluasi migrasi `kelas` string ke `kelasId`.

Rekomendasi paling aman: mulai dari Tahap 1 dan Tahap 2 dulu, lalu refactor
frontend service layer sebelum memecah backend besar-besaran.
