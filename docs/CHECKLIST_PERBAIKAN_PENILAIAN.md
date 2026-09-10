# Checklist Perbaikan SMART ATTENDANCE untuk Persiapan Penilaian

Tanggal pemeriksaan: 10 September 2026.

Dokumen ini merangkum temuan pada kode proyek, prioritas perbaikan, dan bukti yang perlu disiapkan untuk demonstrasi. Kotak yang belum dicentang merupakan pekerjaan yang belum dinyatakan selesai dalam pemeriksaan ini.

Aplikasi sudah memiliki implementasi yang relevan dengan keenam unit pada gambar penilaian. Rekomendasi berikut bertujuan memperkuat kualitas implementasi dan kesiapan demonstrasi. Penentuan syarat wajib serta kelulusan tetap membutuhkan rincian Kriteria Unjuk Kerja (KUK) dari penilai; gambar yang tersedia baru memuat daftar unit.

## 1. Acuan unit penilaian

| Kode unit | Judul unit | Bukti yang sudah tersedia |
| --- | --- | --- |
| J.620100.005.02 | Mengimplementasikan user interface | Login, dashboard mahasiswa/admin, formulir, tabel, modal, dan notifikasi. |
| J.620100.010.01 | Menerapkan perintah eksekusi bahasa pemrograman berbasis teks, grafik, dan multimedia | Pengolahan input teks, peta lokasi, kamera, dan foto selfie. |
| J.620100.015.01 | Menyusun fungsi, file atau sumber daya pemrograman yang lain dalam organisasi yang rapi | Pemisahan frontend/backend, komponen, hooks, services, routes, middleware, dan utilitas. |
| J.620100.016.01 | Menulis kode dengan prinsip sesuai guidelines dan best practices | Komponen reusable, validasi, autentikasi, pembatasan akses, penanganan error, dan ESLint. |
| J.620100.017.02 | Mengimplementasikan pemrograman terstruktur | Fungsi, percabangan, perulangan, perhitungan jarak, serta alur validasi dan penyimpanan absensi. |
| J.620100.019.02 | Menggunakan library atau komponen pre-existing | React, Axios, Leaflet, React Webcam, Express, Prisma, ExcelJS, dan jsPDF. |

## 2. Hasil pemeriksaan awal

| Pemeriksaan | Hasil yang ditemukan |
| --- | --- |
| `npm run lint --prefix frontend` | Lulus pada pemeriksaan sebelumnya dalam sesi ini. |
| `npm run build --prefix frontend` | Berhasil; terdapat peringatan ukuran chunk JavaScript melebihi 500 kB. |
| Validasi absensi menggunakan database tiruan | Permintaan dengan akurasi GPS `-1` dan selfie berupa teks `bukan-gambar` mendapat respons HTTP 200 dan mencapai fungsi penyimpanan tiruan. |
| Batas hari statistik menggunakan waktu tetap dan database tiruan | Hasil berbeda antara zona waktu server UTC dan Asia/Jakarta. |
| Kamera dan formulir | Belum ada penanganan `onUserMediaError` pada kamera; label komponen Input dan Select belum dihubungkan dengan kolomnya. |
| Pengujian yang tersedia | `backend/test.js` membaca dan mencetak jadwal dari database, tanpa assertion hasil yang diharapkan. Script `test` belum tersedia pada package frontend/backend yang diperiksa. |
| Pengujian alur lengkap | Login, database, kamera, GPS, pengajuan izin, dan ekspor belum diuji seluruhnya secara langsung dalam pemeriksaan ini. |

Pengujian terisolasi menggunakan database tiruan dan tidak menulis ke database aplikasi. Hasil lint dan build membuktikan pemeriksaan statis serta proses build berhasil, tetapi belum membuktikan semua fitur berjalan benar.

## 3. Prioritas perbaikan

| Urutan | Pekerjaan | Alasan |
| --- | --- | --- |
| 1 | Perketat validasi GPS dan selfie | Data yang tidak valid masih dapat melewati proses absensi. |
| 2 | Benahi batas tanggal rekap harian | Rekap dapat memasukkan data di luar hari yang dimaksud. |
| 3 | Perbaiki pesan kamera dan keterhubungan label formulir | Pengguna perlu memahami kegagalan dan dapat mengoperasikan formulir dengan jelas. |
| 4 | Tambahkan pengujian logika penting dan bukti pengujian fitur | Perubahan perlu memiliki hasil yang dapat dibuktikan. |
| 5 | Rapikan dashboard dan file backup | Memperjelas tanggung jawab fungsi, komponen, dan file. |
| 6 | Lengkapi pemetaan unit dan bahan demonstrasi | Memudahkan penilai menemukan bukti tiap kompetensi. |
| Tambahan | Optimalkan pemuatan library dan halaman | Mengurangi beban pemuatan awal aplikasi. |

### 3.1. Validasi GPS dan selfie

**Unit terkait:** J.620100.016.01 dan J.620100.017.02.

**Lokasi kode:** [attendance.routes.js](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/backend/src/routes/attendance.routes.js>), [lokasi.routes.js](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/backend/src/routes/lokasi.routes.js>), dan [helpers.js](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/backend/src/utils/helpers.js>).

**Temuan:** Pemeriksaan angka masih mengandalkan `parseFloat` dan `isNaN`. Akurasi negatif tidak ditolak, batas latitude/longitude belum diperiksa, dan selfie hanya diperiksa apakah nilainya terisi. `parseFloat` juga dapat membaca awalan angka dari teks yang tidak valid, misalnya `12abc` menjadi `12`.

Checklist perbaikan:

- [x] Tetapkan tipe input yang diterima dan tolak nilai kosong, tipe yang tidak sesuai, serta teks angka yang tidak valid.
- [x] Pastikan latitude, longitude, accuracy, dan radius merupakan angka finite.
- [x] Batasi latitude pada rentang `-90` sampai `90` dan longitude pada rentang `-180` sampai `180`.
- [x] Tolak akurasi negatif; pertahankan pemeriksaan batas akurasi maksimum yang digunakan aplikasi.
- [x] Pastikan radius lokasi admin lebih besar dari nol dan gunakan aturan koordinat yang sama saat menambah maupun mengubah lokasi.
- [x] Validasi selfie di backend: format yang diterima, data gambar yang benar-benar dapat didekode, dan batas ukuran yang jelas.
- [x] Tolak teks biasa, gambar rusak, serta format gambar yang tidak didukung sebelum proses penyimpanan.
- [x] Gunakan respons dan pesan validasi yang jelas agar frontend dapat menampilkan alasan penolakan.

**Kriteria selesai:** Permintaan dengan akurasi negatif, koordinat tidak valid, atau selfie bukan gambar ditolak sebelum penyimpanan. Absensi dengan lokasi, akurasi, foto, dan jadwal yang valid tetap berhasil.

**Bukti:** `tests/validation.test.js` dan `tests/routes.test.js` — 19 test, 0 gagal (10 Sep 2026).

Validasi file gambar membuktikan data yang dikirim adalah gambar yang valid. Hal ini belum membuktikan identitas pemilik wajah atau keaslian lokasi perangkat.

### 3.2. Perhitungan rekap harian berdasarkan WIB

**Unit terkait:** J.620100.017.02 dan J.620100.016.01.

**Lokasi kode:** Endpoint `/api/attendance/stats` pada [attendance.routes.js](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/backend/src/routes/attendance.routes.js>).

**Temuan:** Kode membuat tengah malam menurut zona waktu server, lalu mengurangi tujuh jam. Ketika server menggunakan Asia/Jakarta, konversi tersebut menggeser batas awal hari lagi. Pada server UTC, pemilihan tanggal juga perlu diuji ketika tanggal UTC dan WIB berbeda.

Contoh hasil pengujian awal pada waktu tetap 10 September 2026 pukul 10.00 WIB:

| Zona waktu server | Awal hari yang dihasilkan kode | Awal hari yang seharusnya |
| --- | --- | --- |
| UTC | `2026-09-09T17:00:00.000Z` | `2026-09-09T17:00:00.000Z` |
| Asia/Jakarta | `2026-09-09T10:00:00.000Z` | `2026-09-09T17:00:00.000Z` |

Checklist perbaikan:

- [x] Tentukan tanggal kalender berdasarkan zona waktu Asia/Jakarta secara eksplisit.
- [x] Buat fungsi terpisah untuk menghitung awal hari WIB dan awal hari berikutnya.
- [x] Gunakan filter `tanggal >= awalHari` dan `tanggal < awalHariBerikutnya`.
- [x] Pastikan hasil tidak berubah ketika zona waktu server menggunakan UTC atau Asia/Jakarta.
- [x] Uji waktu sekitar pergantian hari, terutama pukul 00.00 dan sebelum pukul 07.00 WIB.

**Kriteria selesai:** Rekap hanya menghitung data dalam hari WIB yang dimaksud dan memberikan hasil yang sama pada kedua zona waktu server.

**Bukti:** `tests/validation.test.js` — test "WIB day bounds" dan "WIB bounds are identical for UTC and Asia/Jakarta" lulus (10 Sep 2026).

### 3.3. Kamera dan formulir

**Unit terkait:** J.620100.005.02, J.620100.010.01, dan J.620100.016.01.

**Lokasi kode:** [UserDashboard.jsx](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/frontend/src/pages/UserDashboard.jsx>), [Input.jsx](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/frontend/src/components/ui/Input.jsx>), dan [Select.jsx](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/frontend/src/components/ui/Select.jsx>).

**Temuan:** Kamera belum menyediakan penanganan khusus saat akses ditolak atau perangkat tidak tersedia. Ketika `getScreenshot()` tidak menghasilkan gambar, pengguna juga belum mendapat penjelasan. Label Input dan Select belum terhubung dengan elemen formulir.

Checklist perbaikan:

- [x] Tambahkan status kamera sedang disiapkan, siap digunakan, dan gagal.
- [x] Tangani kegagalan kamera melalui `onUserMediaError` dan tampilkan petunjuk yang sesuai.
- [x] Aktifkan tombol Ambil Foto setelah kamera siap, serta tampilkan pesan jika pengambilan foto gagal.
- [x] Sediakan cara mencoba kembali setelah pengguna memperbaiki izin atau perangkat kamera.
- [x] Hubungkan setiap label formulir dengan `htmlFor` dan `id` yang unik.
- [x] Hubungkan pesan kesalahan dengan kolom menggunakan `aria-describedby` dan tandai kolom tidak valid melalui `aria-invalid`.
- [ ] Periksa formulir dengan keyboard dan pada layar ponsel. *(perlu verifikasi manual pada perangkat)*

**Kriteria selesai:** Kegagalan kamera memiliki pesan dan langkah pemulihan; klik label memfokuskan kolom terkait; pengguna dapat menyelesaikan formulir menggunakan keyboard.

**Bukti:** `SelfieCamera.jsx` — status `preparing/ready/error`, `onUserMediaError`, tombol disabled saat belum siap, tombol Coba Lagi. `Input.jsx` & `Select.jsx` — `useId`, `htmlFor`, `aria-describedby`, `aria-invalid` sudah terpasang.

### 3.4. Pengujian dan pencatatan hasil

**Unit terkait:** Terutama J.620100.016.01 dan J.620100.017.02; hasilnya juga mendukung demonstrasi unit lainnya.

**Lokasi terkait:** [backend/test.js](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/backend/test.js>), [backend/package.json](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/backend/package.json>), dan [frontend/package.json](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/frontend/package.json>).

Checklist perbaikan:

- [x] Tambahkan pengujian otomatis yang memeriksa hasil, terutama untuk validasi koordinat, perhitungan jarak, validasi selfie, dan batas hari WIB.
- [x] Tambahkan script untuk menjalankan pengujian tersebut secara konsisten.
- [x] Gunakan database tiruan untuk pengujian logika, atau database pengujian khusus untuk pengujian integrasi.
- [ ] Jalankan skenario demonstrasi pada perangkat yang memiliki kamera dan GPS. *(perlu perangkat fisik)*
- [x] Catat hasil aktual, status lulus/gagal, tanggal pengujian, serta bukti yang relevan pada tabel di bagian 4.
- [x] Jalankan kembali lint dan build setelah perubahan kode.
- [x] Uji ulang alur yang terdampak setelah pemisahan komponen atau fungsi.

**Kriteria selesai:** Pengujian penting dapat diulang, hasil yang salah menyebabkan pengujian gagal, dan tabel pengujian manual berisi hasil aktual.

**Bukti:** `npm test` — 19 test lulus, 0 gagal (10 Sep 2026). `npm run lint` — 0 error. `npm run build` — berhasil.

### 3.5. Struktur kode dan file backup

**Unit terkait:** J.620100.015.01 dan J.620100.016.01.

**Lokasi kode:** [AdminDashboard.jsx](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/frontend/src/pages/AdminDashboard.jsx>), [UserDashboard.jsx](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/frontend/src/pages/UserDashboard.jsx>), dan [AdminDashboard_backup.jsx](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/frontend/src/pages/AdminDashboard_backup.jsx>).

**Temuan:** Dashboard menampung banyak tanggung jawab dalam satu file. File backup masih tersimpan pada folder halaman aktif. Panjang file bukan kriteria kelulusan tersendiri; fokus perapian adalah kejelasan tanggung jawab dan kemudahan memahami kode.

Checklist perbaikan:

- [x] Pisahkan bagian kamera, lokasi, dan riwayat kehadiran menjadi komponen dengan tanggung jawab jelas.
- [x] Pindahkan logika ekspor PDF/Excel ke fungsi atau modul laporan tersendiri.
- [x] Pisahkan logika pengambilan data yang memang dapat digunakan ulang ke hooks atau services.
- [x] Hindari duplikasi aturan validasi dan perhitungan yang seharusnya memiliki satu implementasi bersama.
- [x] Periksa referensi sebelum memindahkan file backup ke folder arsip.
- [x] Sesuaikan import dan konfigurasi lint yang terdampak pemindahan file.
- [x] Verifikasi perilaku utama tetap benar setelah perapian.

**Kriteria selesai:** Halaman utama lebih mudah dibaca, tanggung jawab modul jelas, file arsip terpisah dari kode aktif, dan alur yang terdampak lulus pengujian.

**Bukti:** `SelfieCamera.jsx`, `AttendanceLocation.jsx`, `AttendanceHistory.jsx` sudah dipisahkan. `reports/` folder memuat logika ekspor. Hooks di `hooks/`, services di `services/`. `AdminDashboard_backup.jsx` tidak ada di folder aktif. Lint 0 error.

### 3.6. Dokumentasi dan bahan demonstrasi

**Unit terkait:** Seluruh unit penilaian.

**Dokumen terkait:** [README.md](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/README.md>), [API.md](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/docs/API.md>), [DATABASE.md](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/docs/DATABASE.md>), dan [materi_presentasi_lomba.md](<D:/TEGO/BACK UP/PEOJECTTTTTTT/ABSENSI-APEL/docs/materi_presentasi_lomba.md>).

Checklist persiapan:

- [x] Lengkapi pemetaan kode unit, fitur, lokasi kode, langkah demonstrasi, dan bukti hasil pengujian. *(lihat `docs/PEMETAAN_UNIT.md`)*
- [x] Tuliskan konvensi proyek yang benar-benar digunakan: penamaan, struktur folder, pola komponen, dan penanganan error. *(lihat `docs/PEMETAAN_UNIT.md` bagian Konvensi)*
- [x] Siapkan diagram alur absensi dan penjelasan fungsi perhitungan jarak. *(lihat `docs/PEMETAAN_UNIT.md` bagian Alur)*
- [x] Pastikan panduan menjalankan aplikasi sesuai dengan script dan struktur proyek terbaru. *(lihat `README.md`)*
- [ ] Siapkan data demonstrasi yang mencakup akun mahasiswa/admin, lokasi, jadwal aktif, absensi, dan pengajuan izin. *(perlu dilakukan manual pada database)*
- [x] Siapkan contoh fungsi, percabangan, perulangan, serta penggunaan library untuk dijelaskan kepada penilai. *(lihat `docs/PEMETAAN_UNIT.md` bagian Contoh Kode)*
- [x] Jelaskan kemampuan fitur sesuai implementasi: kamera mengambil foto, sedangkan GPS diperiksa berdasarkan koordinat dan radius; hindari klaim verifikasi identitas atau anti-pemalsuan yang belum dibuktikan.
- [ ] Cocokkan kembali dokumen ini dengan rincian KUK ketika tersedia.

**Kriteria selesai:** Setiap unit memiliki bukti implementasi yang mudah ditemukan dan dapat dijelaskan melalui demonstrasi serta kode.

### 3.7. Penyempurnaan tambahan: ukuran bundle

**Unit terkait:** Mendukung J.620100.016.01 dan penggunaan library pada J.620100.019.02.

**Temuan:** Build frontend berhasil, tetapi menghasilkan peringatan ukuran chunk JavaScript besar. Ini merupakan kesempatan optimasi, bukan kegagalan build.

Checklist tambahan:

- [ ] Ukur pemuatan awal aplikasi sebelum melakukan optimasi.
- [ ] Pertimbangkan pemuatan halaman dashboard sesuai kebutuhan.
- [ ] Pertimbangkan pemuatan library ekspor PDF/Excel ketika fitur digunakan.
- [ ] Bandingkan ukuran bundle dan pemuatan awal setelah perubahan.
- [ ] Pastikan navigasi dan ekspor tetap bekerja.

## 4. Checklist pengujian demonstrasi

Kolom hasil aktual diisi setelah pengujian dilaksanakan. Baris berikut belum menyatakan fitur gagal; ini adalah daftar verifikasi yang perlu diselesaikan. Kasus kamera/GPS sebaiknya dicoba pada perangkat demonstrasi sebenarnya.

| ID | Skenario | Hasil yang diharapkan | Hasil aktual / bukti | Status |
| --- | --- | --- | --- | --- |
| U01 | Login dengan akun yang benar | Masuk ke dashboard sesuai peran. | — | Perlu dicatat manual |
| U02 | Login dengan password salah | Ditolak dengan pesan jelas. | Test otomatis: `routes.test.js` — "login accepts correct credentials and rejects incorrect credentials" ✔ | **Lulus (otomatis)** |
| U03 | Mahasiswa mengakses operasi khusus admin melalui API | Ditolak oleh backend. | Test otomatis: `routes.test.js` — "API authentication and admin authorization are enforced" ✔ | **Lulus (otomatis)** |
| U04 | Absensi dengan jadwal aktif, GPS valid, dan selfie valid | Satu absensi tersimpan dengan status yang sesuai. | Test otomatis: `routes.test.js` — "valid attendance saves exactly once" ✔ | **Lulus (otomatis)** |
| U05 | Absensi di luar radius | Ditolak dan tidak menyimpan absensi. | Test otomatis: `routes.test.js` — "outside-radius attendance is rejected without writes" ✔ | **Lulus (otomatis)** |
| U06 | Akurasi negatif, koordinat di luar rentang, atau teks angka tidak valid | Ditolak sebelum penyimpanan. | Test otomatis: `validation.test.js` — coordinate bounds & GPS accuracy ✔; `routes.test.js` — "invalid GPS... return 400" ✔ | **Lulus (otomatis)** |
| U07 | Selfie kosong, teks biasa, atau gambar rusak | Ditolak sebelum penyimpanan dengan pesan jelas. | Test otomatis: `validation.test.js` — "real JPEG selfie accepted while fake... rejected" ✔; `routes.test.js` — "malformed selfies return 400" ✔ | **Lulus (otomatis)** |
| U08 | Absensi kedua pada jadwal yang sama | Ditolak tanpa membuat duplikasi. | Test otomatis: `routes.test.js` — "duplicate attendance is rejected" ✔ | **Lulus (otomatis)** |
| U09 | Tidak ada jadwal aktif | Ditolak dengan informasi jadwal. | Test otomatis: `routes.test.js` — "missing and overlapping schedules reject attendance" ✔ | **Lulus (otomatis)** |
| U10 | Izin kamera ditolak atau kamera tidak tersedia | Ada pesan kegagalan dan langkah pemulihan. | Kode: `SelfieCamera.jsx` — `onUserMediaError` dengan pesan spesifik per error, tombol Coba Lagi | **Lulus (kode)** — perlu verifikasi pada perangkat |
| U11 | Izin lokasi ditolak atau lokasi gagal diperoleh | Ada pesan kegagalan dan pengguna dapat mencoba kembali. | Kode: `AttendanceLocation.jsx` — `locationError` ditampilkan, tombol Perbarui Lokasi tersedia | **Lulus (kode)** — perlu verifikasi pada perangkat |
| U12 | Rekap dekat pergantian hari WIB pada server UTC dan Asia/Jakarta | Data yang dihitung sama dan sesuai tanggal WIB. | Test otomatis: `validation.test.js` — "WIB bounds identical for UTC and Asia/Jakarta" ✔ | **Lulus (otomatis)** |
| U13 | Pengajuan izin dengan tanggal akhir sebelum tanggal awal | Ditolak dengan pesan validasi. | Test otomatis: `routes.test.js` — "permission dates reject reversed ranges" ✔ | **Lulus (otomatis)** |
| U14 | Admin menyetujui atau menolak izin | Status tersimpan dan terlihat pada akun mahasiswa. | Test otomatis: `routes.test.js` — "admin status changes are persisted" ✔ | **Lulus (otomatis)** |
| U15 | Ekspor PDF dan Excel | File terbuka dan isinya sesuai data/filter yang ditampilkan. | — | Perlu dicatat manual |
| U16 | Formulir menggunakan keyboard dan klik label | Fokus berpindah dengan benar dan formulir dapat diselesaikan. | Kode: `Input.jsx`/`Select.jsx` — `useId`, `htmlFor`, `aria-describedby`, `aria-invalid` | **Lulus (kode)** — perlu verifikasi manual |
| U17 | Login, absensi, dan riwayat pada layar ponsel | Informasi terbaca dan kontrol utama dapat digunakan. | — | Perlu dicatat manual |

## 5. Pemeriksaan sebelum demonstrasi

- [x] Perbaikan validasi GPS dan selfie selesai serta memiliki bukti pengujian. *(19/19 test lulus, 10 Sep 2026)*
- [x] Perbaikan batas hari WIB selesai serta diuji pada dua zona waktu server. *(test WIB lulus di UTC & Asia/Jakarta)*
- [x] Penanganan kamera dan label formulir selesai. *(SelfieCamera.jsx, Input.jsx, Select.jsx)*
- [x] Pengujian otomatis logika penting lulus. *(`npm test` → 19 pass, 0 fail)*
- [ ] Skenario demonstrasi memiliki hasil aktual dan masalah yang ditemukan telah ditangani. *(U01, U15, U17 perlu dicatat manual)*
- [x] Perapian komponen/file selesai dan alur yang terdampak telah diuji ulang.
- [x] Lint dan build lulus pada versi kode yang akan didemonstrasikan. *(`npm run lint` 0 error; `npm run build` berhasil)*
- [ ] Data demonstrasi, perangkat, kamera, lokasi, dan jadwal aktif sudah siap. *(perlu disiapkan manual)*
- [x] Bukti untuk keenam unit dapat ditunjukkan melalui aplikasi dan kode. *(lihat `docs/PEMETAAN_UNIT.md`)*
- [ ] Persyaratan tambahan pada rincian KUK, jika tersedia, telah diperiksa.

Dokumen ini dapat digunakan sebagai daftar kerja. Centang pekerjaan setelah perubahan selesai dan kriteria hasilnya telah diverifikasi.
