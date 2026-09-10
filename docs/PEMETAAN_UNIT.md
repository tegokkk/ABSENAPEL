# Pemetaan Unit Kompetensi — SMART ATTENDANCE

Dokumen ini memetakan setiap unit penilaian ke fitur aplikasi, lokasi kode, dan bukti implementasi.
Dibuat: 10 September 2026.

---

## Daftar Unit

| Kode unit | Judul unit |
|---|---|
| J.620100.005.02 | Mengimplementasikan user interface |
| J.620100.010.01 | Menerapkan perintah eksekusi bahasa pemrograman berbasis teks, grafik, dan multimedia |
| J.620100.015.01 | Menyusun fungsi, file, atau sumber daya pemrograman dalam organisasi yang rapi |
| J.620100.016.01 | Menulis kode dengan prinsip sesuai guidelines dan best practices |
| J.620100.017.02 | Mengimplementasikan pemrograman terstruktur |
| J.620100.019.02 | Menggunakan library atau komponen pre-existing |

---

## J.620100.005.02 — Mengimplementasikan User Interface

### Fitur yang Diimplementasikan

| Fitur | File | Deskripsi |
|---|---|---|
| Halaman login | `frontend/src/pages/Login.jsx` | Form login dengan validasi dan pesan error |
| Dashboard mahasiswa | `frontend/src/pages/UserDashboard.jsx` | Grid 3 kolom: info pengguna, kamera selfie, lokasi, riwayat |
| Dashboard admin | `frontend/src/pages/AdminDashboard.jsx` | Tab manajemen: absensi, jadwal, izin, lokasi, data mahasiswa |
| Komponen UI reusable | `frontend/src/components/ui/` | Button, Input, Select, Card, Modal, Badge, Table, Feedback |
| Modal pengajuan izin | `UserDashboard.jsx` — `<Modal>` | Form multi-field dengan upload lampiran |
| Notifikasi toast | `frontend/src/components/ui/Feedback.jsx` | Pesan sukses/error/warning non-intrusive |

### Cara Demonstrasi

1. Buka aplikasi → tampilkan halaman login.
2. Login sebagai mahasiswa → tampilkan `UserDashboard` dengan status kesiapan absen.
3. Login sebagai admin → tampilkan `AdminDashboard` dengan navigasi tab.
4. Tunjukkan modal "Ajukan Izin" dan komponen form (label klik → fokus ke input).

---

## J.620100.010.01 — Menerapkan Perintah Eksekusi Berbasis Teks, Grafik, dan Multimedia

### Fitur yang Diimplementasikan

| Fitur | File | Deskripsi |
|---|---|---|
| Kamera selfie (multimedia) | `frontend/src/components/attendance/SelfieCamera.jsx` | Akses webcam, pratinjau live, tangkap foto |
| Peta lokasi (grafik) | `frontend/src/components/attendance/AttendanceLocation.jsx` | Peta Leaflet interaktif dengan marker dan radius |
| Ekspor PDF (grafik) | `frontend/src/reports/attendanceReport.js` | Generate laporan PDF dengan jsPDF & autotable |
| Ekspor Excel (teks/data) | `frontend/src/reports/attendanceReport.js` | Generate file XLSX dengan ExcelJS |
| Pengolahan input teks | `frontend/src/pages/` | Semua form: login, jadwal, lokasi, izin |

### Cara Demonstrasi

1. Buka UserDashboard → tampilkan pratinjau kamera.
2. Tangkap foto → tampilkan hasil selfie.
3. Tampilkan peta dengan marker lokasi pengguna dan lingkaran radius admin.
4. Di AdminDashboard → ekspor laporan ke PDF dan Excel.

---

## J.620100.015.01 — Menyusun Fungsi, File, dan Sumber Daya dalam Organisasi Rapi

### Struktur Folder

```
frontend/src/
├── pages/          # Halaman (UserDashboard, AdminDashboard, Login)
├── components/
│   ├── ui/         # Komponen primitif (Button, Input, Select, Card, Modal...)
│   └── attendance/ # Komponen domain absensi (SelfieCamera, AttendanceLocation, AttendanceHistory)
├── hooks/          # Custom hooks (useCurrentLocation, useDebounce, useUiFeedback)
├── services/       # API layer (attendanceApi, izinApi, settingsApi)
├── reports/        # Logika ekspor PDF/Excel
└── utils/          # Utilitas murni (dateTime, dll.)

backend/src/
├── routes/         # Endpoint API (attendance, lokasi, jadwal, izin, users, auth, ...)
├── middlewares/    # auth.js (authMiddleware, adminOnly)
└── utils/          # validation.js, helpers.js, dateTime.js, distance.js, prisma.js
```

### Cara Demonstrasi

1. Buka folder proyek di editor → tampilkan struktur direktori.
2. Tunjukkan `SelfieCamera.jsx` sebagai komponen dengan satu tanggung jawab (kamera).
3. Tunjukkan `attendanceReport.js` — logika ekspor terpisah dari komponen UI.
4. Tunjukkan `backend/src/utils/validation.js` — semua aturan validasi di satu tempat.

---

## J.620100.016.01 — Menulis Kode Sesuai Guidelines dan Best Practices

### Implementasi

| Praktik | Lokasi | Deskripsi |
|---|---|---|
| Komponen reusable | `components/ui/` | Input, Select, Button dll. dengan prop interface yang jelas |
| Validasi ketat backend | `backend/src/utils/validation.js` | `parseFiniteDecimal`, `validateGps`, `validateSelfie`, `validateLocation` |
| Autentikasi & otorisasi | `backend/src/middlewares/auth.js` | JWT middleware, `adminOnly` guard |
| Pembatasan akses | `attendance.routes.js`, `lokasi.routes.js`, dll. | Role check pada setiap endpoint sensitif |
| Penanganan error | Semua routes | Try-catch, respons HTTP dengan kode status yang sesuai |
| ESLint | `frontend/.eslintrc.*` | 0 error pada `npm run lint` (10 Sep 2026) |
| Aria & aksesibilitas | `Input.jsx`, `Select.jsx`, `SelfieCamera.jsx` | `aria-describedby`, `aria-invalid`, `aria-label`, `role` |
| Guard request duplikat | `attendance.routes.js` | `activeRequests` Set mencegah double-submit |

### Bukti Pengujian

- `npm run lint` → 0 error
- `npm run build` → berhasil (10 Sep 2026)
- `npm test` → 19 pass, 0 fail (10 Sep 2026)

---

## J.620100.017.02 — Mengimplementasikan Pemrograman Terstruktur

### Contoh Fungsi, Percabangan, dan Perulangan

#### 1. Fungsi Haversine — Perhitungan Jarak (backend)
**File:** `backend/src/utils/distance.js`

```js
// Fungsi dengan parameter input dan nilai kembalian
function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // radius bumi dalam meter
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

#### 2. Percabangan Status Absensi (backend)
**File:** `backend/src/routes/attendance.routes.js`

```js
// Percabangan: menentukan status berdasarkan waktu
const isLate = nowTime > (activeJadwal.batas_terlambat || activeJadwal.waktu_mulai);
const status = isLate ? "TERLAMBAT" : "HADIR";

// Percabangan: tolak jika jarak melebihi radius
if (distance > adminRadius) {
  return res.status(400).json({
    success: false,
    message: "Anda berada di luar area lokasi apel.",
    distance: roundedDistance,
    allowedRadius: adminRadius,
  });
}
```

#### 3. Perulangan — Rekap Per Kelas (backend)
**File:** `backend/src/routes/attendance.routes.js`

```js
// Perulangan untuk menghitung absensi per kelas
const byKelas = {};
const classes = ["MI 4A", "MI 4B", "MI 4C", "MI 4D"];
for (const kelas of classes) {
  byKelas[kelas] = todayAttendances.filter((a) => a.user.kelas === kelas).length;
}
```

#### 4. Alur Validasi Selfie (backend)
**File:** `backend/src/utils/validation.js`

```js
// Fungsi bertingkat: cek format → cek base64 → cek magic bytes → decode piksel
async function validateSelfie(value) {
  if (!value) throw new ValidationError('Foto selfie wajib disertakan.');
  if (typeof value !== 'string' || !value.startsWith(SELFIE_PREFIX)) {
    throw new ValidationError('Foto selfie harus berupa gambar JPEG dalam format data URL base64.');
  }
  // ... cek ukuran, validasi base64, cek magic bytes 0xFF 0xD8
  await sharp(buffer, { failOn: 'warning', limitInputPixels: MAX_SELFIE_PIXELS }).raw().toBuffer();
  return value;
}
```

#### 5. Alur Absensi Lengkap (diagram)

```
Permintaan absensi masuk
  │
  ├─ [1] Validasi GPS (lat/lon/acc) → error 400 jika tidak valid
  ├─ [2] Validasi selfie (format/JPEG/ukuran) → error 400 jika tidak valid
  ├─ [3] Cek jadwal aktif → error 400 jika tidak ada atau lebih dari satu
  ├─ [4] Cek sudah absen hari ini → error 400 jika sudah
  ├─ [5] Ambil lokasi admin aktif → error 400 jika tidak ada
  ├─ [6] Hitung jarak Haversine → error 400 jika melebihi radius
  ├─ [7] Tentukan status HADIR/TERLAMBAT berdasarkan batas_terlambat
  └─ [8] Simpan ke database → kirim respons 200 sukses
```

---

## J.620100.019.02 — Menggunakan Library atau Komponen Pre-existing

### Daftar Library

| Library | Digunakan Untuk | Lokasi Penggunaan |
|---|---|---|
| **React** | Framework UI, state, hooks | Seluruh `frontend/src/` |
| **Axios** | HTTP request ke backend API | `frontend/src/services/` |
| **Leaflet** (React-Leaflet) | Peta interaktif dengan marker dan radius | `AttendanceLocation.jsx` |
| **React Webcam** | Akses kamera dan tangkap foto | `SelfieCamera.jsx` |
| **Lucide React** | Icon vektor konsisten | Seluruh komponen UI |
| **Express** | Framework server HTTP | `backend/server.js`, semua routes |
| **Prisma** | ORM akses database PostgreSQL | `backend/src/utils/prisma.js`, semua routes |
| **ExcelJS** | Generate file Excel (.xlsx) | `frontend/src/reports/attendanceReport.js` |
| **jsPDF** + autotable | Generate file PDF | `frontend/src/reports/attendanceReport.js` |
| **Sharp** | Decode & validasi gambar JPEG | `backend/src/utils/validation.js` |
| **bcryptjs** | Hash password | `backend/src/routes/auth.routes.js` |
| **jsonwebtoken** | Buat & verifikasi JWT | `backend/src/middlewares/auth.js` |

### Cara Demonstrasi

1. Buka peta di UserDashboard → tunjukkan Leaflet bekerja (marker, popup, lingkaran radius).
2. Tangkap selfie → tunjukkan React Webcam mengakses kamera.
3. Ekspor laporan → tunjukkan file PDF/Excel berhasil dibuat dengan jsPDF/ExcelJS.
4. Buka `backend/src/utils/validation.js` → tunjukkan `sharp` mendecode gambar JPEG.

---

## Konvensi Proyek

### Penamaan

| Tipe | Konvensi | Contoh |
|---|---|---|
| Komponen React | PascalCase | `SelfieCamera.jsx`, `UserDashboard.jsx` |
| File utilitas | camelCase | `validation.js`, `dateTime.js` |
| File routes | `*.routes.js` | `attendance.routes.js` |
| Konstanta | UPPER_SNAKE_CASE | `MAX_SELFIE_BYTES`, `SELFIE_PREFIX` |
| CSS class | `kebab-case` | `form-input`, `surface-hero` |

### Struktur Respons API

```json
// Sukses
{ "success": true, "message": "Absen apel berhasil.", "status": "HADIR" }

// Error validasi
{ "success": false, "message": "Akurasi GPS tidak boleh negatif." }

// Error server
{ "error": "Server error" }
```

### Penanganan Error Frontend

- Error validasi form ditampilkan sebagai pesan di bawah field atau notifikasi toast.
- Error jaringan/server ditangkap di `catch` dan ditampilkan via `notify()` toast.
- Status loading ditandai dengan prop `loading` pada `<Button>`.

---

## Panduan Menjalankan Aplikasi

```bash
# Install dependensi
npm install --prefix backend
npm install --prefix frontend

# Jalankan backend (development)
npm run dev --prefix backend

# Jalankan frontend (development)
npm run dev --prefix frontend

# Jalankan pengujian backend
npm test --prefix backend

# Periksa kode frontend
npm run lint --prefix frontend

# Build frontend untuk produksi
npm run build --prefix frontend
```

Backend memerlukan file `.env` yang berisi `DATABASE_URL` dan `JWT_SECRET`.
Skema database dikelola oleh Prisma (`backend/prisma/schema.prisma`).
