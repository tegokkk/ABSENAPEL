# Naskah Presentasi SMART ATTENDANCE (Absensi Apel)

**Tema/Judul:** SMART ATTENDANCE - Inovasi Digital Absensi Apel Manajemen Informatika
**Waktu:** ± 10-15 Menit
**Pembicara:** 
1. **Orlean** (Pembuka, Hook, Latar Belakang, & Konsep Utama)
2. **Egi** (Fitur Unggulan, Arsitektur Sistem, & Teknologi)
3. **Tego** (Alur Penggunaan, Analisis Dampak, & Penutup)

---

## 🎤 BAGIAN 1: ORLEAN 
*(Fokus: Membangun ketertarikan (Hook), mengidentifikasi masalah akar, dan menawarkan solusi visioner)*

**[Slide: Judul Aplikasi & Tim]**

**Orlean:**
"Assalamualaikum Wr. Wb. Selamat pagi/siang Dewan Juri yang terhormat, Bapak/Ibu Dosen, serta rekan-rekan audiens sekalian. Kami dari tim [Nama Tim] sangat bangga bisa hadir di sini. 

Bayangkan sebuah pagi di kampus, ratusan mahasiswa berkumpul untuk apel. Berapa banyak kertas absen yang dicetak? Berapa jam waktu yang dihabiskan admin untuk merekap? Dan yang paling penting, seberapa yakin kita bahwa data yang terkumpul itu 100% valid? Hari ini, kami hadir membawa solusi untuk menjawab tantangan tersebut melalui **SMART ATTENDANCE**.

**[Slide: Latar Belakang & Permasalahan]**

**Orlean:**
"Kegiatan 'Apel' adalah pilar kedisiplinan di Manajemen Informatika. Namun, kita masih terjebak pada metode konvensional yang memiliki tiga *pain points* utama:
1. **Integritas Data Rendah:** Praktik 'titip absen' sangat mudah dilakukan.
2. **Inefisiensi Operasional:** Rekapitulasi manual memakan waktu berhari-hari dan rawan *human error*.
3. **Tidak Real-time:** Dosen atau pimpinan kesulitan melihat tingkat kehadiran saat itu juga.

Ketidakefisienan ini justru mengurangi muruah dari kedisiplinan itu sendiri."

**[Slide: Solusi - Pengenalan Smart Attendance]**

**Orlean:**
"Oleh karena itu, kami merancang **SMART ATTENDANCE**. Bukan sekadar aplikasi presensi biasa, melainkan sebuah ekosistem digital terintegrasi yang kami bangun dari nol secara *full-stack*. Misi kami sederhana: mewujudkan presensi yang **cepat, transparan, dan anti-manipulasi**. 

Bagaimana kami memastikan sistem ini benar-benar tidak bisa diakali? Rekan saya, Egi, akan membedah teknologi di baliknya. Silakan, Egi."

---

## 🎤 BAGIAN 2: EGI
*(Fokus: Keunggulan kompetitif fitur, keamanan data, dan Tech Stack)*

**[Slide: Double Validation System (GPS & Live Selfie)]**

**Egi:**
"Terima kasih, Orlean. Selamat pagi/siang Dewan Juri sekalian. Saya Egi. Jantung dari Smart Attendance terletak pada keamanannya. Kami menerapkan **Double Validation System**:

1. **Precision Geofencing (Validasi Radius GPS):** Sistem melacak koordinat *device* secara *real-time*. Kami menetapkan titik pusat lokasi apel (Latitude & Longitude) beserta radius toleransinya (misal 50 meter). Jika mahasiswa berada di luar zona hijau, akses absen otomatis diblokir.
2. **Anti-Spoofing Live Capture:** Menekan tombol hadir di lokasi saja tidak cukup. Mahasiswa wajib melakukan foto wajah (*selfie*) secara *live* menggunakan *Webcam/Kamera HP*. Sistem kami memblokir upaya *upload* dari galeri, sehingga memastikan kehadiran fisik yang bersangkutan."

**[Slide: Modul Admin & Digitalisasi Izin]**

**Egi:**
"Kami juga mendigitalkan birokrasi izin. Melalui modul **Pengajuan Izin**, mahasiswa bisa melampirkan surat sakit/izin secara digital. Admin dapat melakukan validasi (*Approve/Reject*) dengan satu klik, tanpa tumpukan kertas. 
Selain itu, **Admin Panel** memberikan kendali penuh atas manajemen jadwal, titik lokasi koordinat, serta *dashboard* rekapitulasi data harian."

**[Slide: Arsitektur & Tech Stack Modern]**

**Egi:**
"Untuk memastikan aplikasi ini berjalan cepat meski diakses ratusan mahasiswa secara bersamaan, kami menggunakan *Tech Stack* kelas industri:
- **Frontend:** Kami menggunakan **React 19** dan **Vite** dipadukan dengan **Tailwind CSS**, menghasilkan antarmuka (*UI*) yang sangat modern, ringan, dan *Mobile-First*.
- **Backend:** Kami membangun *RESTful API* menggunakan **Node.js, Express, dan Prisma ORM**.
- **Database:** Kami beralih ke **PostgreSQL via Supabase** untuk menjamin integritas relasi data yang kuat serta skalabilitas tingkat tinggi.

Lalu, semudah apa mahasiswa dan admin menggunakan sistem canggih ini? Rekan saya, Tego, akan mendemonstrasikannya. Silakan, Tego."

---

## 🎤 BAGIAN 3: TEGO
*(Fokus: Pembuktian kemudahan (UI/UX), ringkasan dampak (Impact), dan ajakan penutup)*

**[Slide: Demo Alur Penggunaan / Flowchart]**

**Tego:**
"Terima kasih, Egi. Halo Dewan Juri, saya Tego. Teknologi yang hebat harus diimbangi dengan kemudahan penggunaan. Mari kita lihat alurnya:

*[Jika ada live demo, Tego melakukan demo singkat. Jika tidak, jelaskan dari slide]*
1. **Buka & Login:** Mahasiswa masuk ke *dashboard* responsif kami.
2. **Klik Absen:** Saat jadwal apel aktif, tombol absen akan muncul.
3. **Otomatisasi Validasi:** Begitu diklik, sistem mengecek GPS. Jika valid, kamera menyala.
4. **Jepret & Selesai:** Mahasiswa *selfie*, data terkirim, dan status langsung berubah menjadi 'Hadir' secara *real-time*. Keseluruhan proses ini memakan waktu kurang dari 10 detik!

Bagi Admin? Tidak ada lagi rekap manual. Di layar admin, grafik kehadiran dan persentase kedisiplinan langsung ter-*update* detik itu juga. Laporan bisa di-*export* ke PDF/Excel kapan saja."

**[Slide: Dampak & Keberlanjutan (Impact & Sustainability)]**

**Tego:**
"Dengan **SMART ATTENDANCE**, kami tidak sekadar membuat aplikasi. Kami menciptakan dampak nyata:
1. **Integritas Kedisiplinan 100% Terjaga:** Menutup rapat celah manipulasi.
2. **Efisiensi & Eco-Friendly:** Menghemat ratusan jam kerja dan 100% *paperless*.
3. **Data-Driven Decision:** Pimpinan kini memiliki data *real-time* yang akurat untuk mengevaluasi tingkat kedisiplinan mahasiswa."

**[Slide: Penutup]**

**Tego:**
"Dewan Juri yang terhormat, di era transformasi digital ini, Manajemen Informatika harus menjadi pionir. Melalui Smart Attendance, kami siap membawa budaya disiplin kita melangkah ke masa depan—lebih cepat, lebih akurat, dan lebih terukur.

Sekian presentasi dari tim kami: Orlean, Egi, dan Tego. Kami sangat antusias untuk berdiskusi lebih lanjut dan siap menjawab pertanyaan Bapak/Ibu. 
Wassalamualaikum Wr. Wb."

---

## 💡 LAMPIRAN: Antisipasi Pertanyaan Juri (Q&A Preparation)

Berikut adalah beberapa pertanyaan yang mungkin ditanyakan oleh Juri, beserta panduan jawabannya:

1. **Bagaimana jika mahasiswa memanipulasi GPS (Fake GPS)?**
   *Jawaban (Egi/Tego):* "Sistem kami mengambil koordinat langsung dari API browser tingkat dasar. Untuk pengembangan ke depannya, kami bisa menambahkan sistem deteksi mock-location pada level aplikasi native jika dibungkus menjadi PWA/APK. Namun saat ini, kombinasi Fake GPS tetap bisa digagalkan karena mahasiswa harus tetap melakukan Live Selfie di lokasi yang sesuai (jika ada *background* spesifik yang diwajibkan)."

2. **Bagaimana jika koneksi internet sedang buruk saat apel?**
   *Jawaban (Orlean/Tego):* "Aplikasi ini dirancang sangat ringan (menggunakan React + Vite). Payload data absensi beserta foto sudah dikompresi sebelum dikirim. Jika gagal, *error handling* di *frontend* akan meminta *user* mencoba ulang tanpa harus memuat ulang seluruh halaman."

3. **Berapa kapasitas user yang bisa ditampung bersamaan?**
   *Jawaban (Egi):* "Karena kami menggunakan PostgreSQL di Supabase dan Node.js di backend, aplikasi ini sangat *scalable* dan mampu menangani ribuan *request* bersamaan (*concurrent requests*) tanpa kendala."

4. **Apa bedanya aplikasi ini dengan Google Form biasa?**
   *Jawaban (Semua Tim):* "Google Form tidak memiliki validasi radius GPS otomatis dan tidak bisa memaksakan *live camera* (orang bisa upload foto lama). Selain itu, sistem kami memiliki *Dashboard* terintegrasi untuk pengajuan izin dan kalkulasi statistik otomatis yang tidak dimiliki Google Form."
