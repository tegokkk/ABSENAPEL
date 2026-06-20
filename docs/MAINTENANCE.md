# Dokumentasi Maintenance

Dokumen ini berisi panduan untuk admin sistem / developer dalam melakukan maintenance harian maupun insidental.

## Script Helper Admin
Di dalam folder `backend/scripts/` tersedia beberapa utilitas CLI:

1. **`check-admin.js`**
   - **Fungsi:** Melihat ketersediaan admin di database, menguji hash bcrypt, dan melihat NPM pengguna (debug).
   - **Cara pakai:** `npm run check:admin` dari folder `backend`.

2. **`reset-admin.js`**
   - **Fungsi:** Me-reset (update/upsert) password admin (`TIMDIS1` dan `TIMDIS2`) jika terjadi lupa sandi atau hash rusak.
   - **Cara pakai:** `npm run reset:admin` dari folder `backend`.

3. **`seed.js`**
   - **Fungsi:** Mengosongkan data dan memuat data master awal secara dummy (Kelas, Jadwal, Mahasiswa, dan Admin).
   - **Risiko:** *High Risk!* Eksekusi ini akan **MENGHAPUS** semua absensi dan perizinan. 
   - **Cara pakai:** `npm run seed` dari folder `backend`.

## Tindakan Pencegahan (Security)
- Jangan pernah mem-commit file `.env` atau `.env.local` ke repository.
- Pastikan limit upload gambar di backend tidak diubah menjadi nilai yang sangat besar (default 10mb) untuk mencegah serangan DDOS Payload base64.
- Fungsi seeding `/api/seed` yang dapat diakses via browser hanya boleh dibiarkan aktif pada lingkungan pengembangan, segera beri blok jika sudah live.

## Pembersihan Berkas Lokal
Folder `backend/uploads/` digunakan secara default untuk menyimpan foto selfie di lokal jika tidak diarahkan ke bucket storage khusus.
Secara berkala, lakukan pembersihan terhadap file lama untuk menghemat kapasitas storage:
- *Di Linux/Mac:* `find backend/uploads/ -type f -mtime +30 -name '*.jpg' -delete`
- Atau lakukan penghapusan manual pada file lawas.
