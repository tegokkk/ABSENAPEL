const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const app = express();
const PORT = 5000;
const SECRET_KEY = 'smartattendance_timdis_2024';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// =============================================
// HELPER FUNCTIONS
// =============================================

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getSettings() {
  const rows = await prisma.settings.findMany();
  const map = {};
  rows.forEach(r => map[r.key] = r.value);
  return {
    OFFICE_LAT: parseFloat(map.OFFICE_LAT ?? '-5.367235'),
    OFFICE_LON: parseFloat(map.OFFICE_LON ?? '105.226727'),
    MAX_RADIUS: parseFloat(map.MAX_RADIUS ?? '100'),
    BATAS_TERLAMBAT: map.BATAS_TERLAMBAT ?? '08:00'
  };
}

function checkIsLate(batasTerlambat) {
  const now = new Date();
  const [batasHour, batasMenit] = batasTerlambat.split(':').map(Number);
  if (now.getHours() > batasHour) return true;
  if (now.getHours() === batasHour && now.getMinutes() >= batasMenit) return true;
  return false;
}

// =============================================
// MIDDLEWARE
// =============================================

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized. Silakan login terlebih dahulu.' });
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin yang dapat mengakses fitur ini.' });
  }
  next();
};

// =============================================
// AUTH
// =============================================

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    const user = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (!user) return res.status(401).json({ error: 'Username atau password salah' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Username atau password salah' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, kelas: user.kelas, npm: user.npm },
      SECRET_KEY,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        kelas: user.kelas,
        npm: user.npm
      }
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// =============================================
// SETTINGS (Admin Only untuk PUT)
// =============================================

app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/settings', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { OFFICE_LAT, OFFICE_LON, MAX_RADIUS, BATAS_TERLAMBAT } = req.body;
    const updates = { OFFICE_LAT, OFFICE_LON, MAX_RADIUS, BATAS_TERLAMBAT };

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && value !== null && value !== '') {
        await prisma.settings.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        });
      }
    }

    const newSettings = await getSettings();
    res.json({ message: 'Pengaturan berhasil disimpan', settings: newSettings });
  } catch (error) {
    console.error('[SETTINGS ERROR]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// =============================================
// USERS — CRUD (Admin Only)
// =============================================

app.get('/api/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { kelas } = req.query;
    const where = { role: 'MAHASISWA' };
    if (kelas && kelas !== 'Semua Kelas') where.kelas = kelas;

    const users = await prisma.user.findMany({
      where,
      select: { id: true, username: true, name: true, npm: true, kelas: true, role: true },
      orderBy: [{ kelas: 'asc' }, { name: 'asc' }]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, npm, kelas } = req.body;
    if (!name || !npm || !kelas) {
      return res.status(400).json({ error: 'Nama, NPM, dan kelas wajib diisi' });
    }

    const hashedPassword = await bcrypt.hash(npm.trim(), 10);
    const user = await prisma.user.create({
      data: {
        username: name.trim(),
        password: hashedPassword,
        name: name.trim(),
        npm: npm.trim(),
        kelas,
        role: 'MAHASISWA'
      }
    });
    res.status(201).json({
      message: 'Mahasiswa berhasil ditambahkan',
      user: { id: user.id, name: user.name, npm: user.npm, kelas: user.kelas }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Nama atau NPM sudah terdaftar' });
    }
    console.error('[ADD USER ERROR]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, npm, kelas } = req.body;

    const updateData = {};
    if (name) { updateData.name = name.trim(); updateData.username = name.trim(); }
    if (npm) updateData.npm = npm.trim();
    if (kelas) updateData.kelas = kelas;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: { id: true, name: true, npm: true, kelas: true, username: true }
    });
    res.json({ message: 'Data mahasiswa berhasil diperbarui', user });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Nama atau NPM sudah digunakan' });
    }
    console.error('[EDIT USER ERROR]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.attendance.deleteMany({ where: { userId: parseInt(id) } });
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Mahasiswa berhasil dihapus beserta seluruh data absensinya' });
  } catch (error) {
    console.error('[DELETE USER ERROR]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id/reset-password', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const newPassword = await bcrypt.hash(user.npm || '123456', 10);
    await prisma.user.update({ where: { id: parseInt(id) }, data: { password: newPassword } });
    res.json({ message: `Password berhasil direset ke NPM: ${user.npm}` });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// =============================================
// ATTENDANCE
// =============================================

app.post('/api/attendance/apel', authMiddleware, upload.single('foto_selfie'), async (req, res) => {
  try {
    const { latitude, longitude, alamat_lokasi, device_info, ip_address } = req.body;
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Koordinat tidak valid' });
    }

    const settings = await getSettings();
    const distance = getDistance(lat, lon, settings.OFFICE_LAT, settings.OFFICE_LON);

    if (distance > settings.MAX_RADIUS) {
      return res.status(400).json({
        error: `Anda berada di luar radius absen. Jarak Anda: ${distance.toFixed(0)}m (maks. ${settings.MAX_RADIUS}m)`
      });
    }

    // Cek sudah absen hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: {
        userId: req.user.id,
        tanggal: { gte: today }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Anda sudah melakukan absen apel hari ini.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Foto selfie wajib disertakan' });
    }

    const fotoPath = `/uploads/${req.file.filename}`;
    const isLate = checkIsLate(settings.BATAS_TERLAMBAT);
    const status = isLate ? 'TERLAMBAT' : 'HADIR';

    const attendance = await prisma.attendance.create({
      data: {
        userId: req.user.id,
        jam_absen: new Date(),
        status,
        latitude: lat,
        longitude: lon,
        alamat_lokasi: alamat_lokasi || null,
        device_info: device_info || null,
        ip_address: ip_address || null,
        foto_selfie: fotoPath
      }
    });

    res.json({ ...attendance, status });
  } catch (error) {
    console.error('[ATTENDANCE ERROR]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/attendance', authMiddleware, async (req, res) => {
  try {
    const filters = {};

    if (req.user.role !== 'ADMIN') {
      // Mahasiswa hanya lihat absensi dirinya sendiri
      filters.userId = req.user.id;
    } else {
      // Admin filter by kelas
      if (req.query.kelas && req.query.kelas !== 'Semua Kelas') {
        filters.user = { kelas: req.query.kelas };
      }
    }

    const records = await prisma.attendance.findMany({
      where: filters,
      include: {
        user: { select: { name: true, username: true, kelas: true, npm: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(records);
  } catch (error) {
    console.error('[GET ATTENDANCE ERROR]', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/attendance/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.attendance.delete({ where: { id_absensi: parseInt(id) } });
    res.json({ message: 'Data absensi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Statistik absensi (hari ini, per kelas)
app.get('/api/attendance/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendances = await prisma.attendance.findMany({
      where: { tanggal: { gte: today } },
      include: { user: { select: { kelas: true } } }
    });

    const totalToday = todayAttendances.length;
    const hadir = todayAttendances.filter(a => a.status === 'HADIR').length;
    const terlambat = todayAttendances.filter(a => a.status === 'TERLAMBAT').length;

    const byKelas = {};
    const classes = ['MI 4A', 'MI 4B', 'MI 4C', 'MI 4D'];
    for (const kelas of classes) {
      byKelas[kelas] = todayAttendances.filter(a => a.user.kelas === kelas).length;
    }

    res.json({ totalToday, hadir, terlambat, byKelas });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// =============================================
// SEED — Reset dan isi ulang database
// =============================================

app.get('/api/seed', async (req, res) => {
  try {
    // Hapus semua data lama
    await prisma.attendance.deleteMany();
    await prisma.user.deleteMany();

    // Inisialisasi settings default
    const defaultSettings = [
      { key: 'OFFICE_LAT', value: '-5.367235' },
      { key: 'OFFICE_LON', value: '105.226727' },
      { key: 'MAX_RADIUS', value: '100' },
      { key: 'BATAS_TERLAMBAT', value: '08:00' }
    ];

    await prisma.settings.deleteMany();
    for (const s of defaultSettings) {
      await prisma.settings.create({ data: s });
    }

    // Buat akun admin
    const admins = [
      { username: 'TIMDIS1', password: 'TIMDIS1', name: 'Admin TIMDIS 1' },
      { username: 'TIMDIS2', password: 'TIMDIS2', name: 'Admin TIMDIS 2' }
    ];

    for (const admin of admins) {
      const hashedPw = await bcrypt.hash(admin.password, 10);
      await prisma.user.create({
        data: {
          username: admin.username,
          password: hashedPw,
          name: admin.name,
          role: 'ADMIN',
          kelas: null,
          npm: null
        }
      });
    }

    // Data seluruh mahasiswa 4 kelas
    const students = [
      // ===== MI 4A =====
      { name: 'Abdur Rouf Hanafi', npm: '24781001', kelas: 'MI 4A' },
      { name: 'Ahmad Rizky Maulana', npm: '24781002', kelas: 'MI 4A' },
      { name: 'Alzahra Dwi Febriyan', npm: '24781003', kelas: 'MI 4A' },
      { name: 'Atta Zaky Ramadhan', npm: '24781004', kelas: 'MI 4A' },
      { name: 'Bunga Putri Salsabilla', npm: '24781005', kelas: 'MI 4A' },
      { name: 'Dafa Anggara Yonata', npm: '24781006', kelas: 'MI 4A' },
      { name: 'Deni Prawira', npm: '24781007', kelas: 'MI 4A' },
      { name: 'Dona Virza', npm: '24781008', kelas: 'MI 4A' },
      { name: 'Fahmi Ghozali', npm: '24781009', kelas: 'MI 4A' },
      { name: 'Farhan Habibullah', npm: '24781010', kelas: 'MI 4A' },
      { name: 'Fitri Amelia Ananti', npm: '24781011', kelas: 'MI 4A' },
      { name: 'Heidy Putri Shafira', npm: '24781012', kelas: 'MI 4A' },
      { name: 'Jesfitrina Sihombing', npm: '24781013', kelas: 'MI 4A' },
      { name: 'Lia Agustina', npm: '24781014', kelas: 'MI 4A' },
      { name: 'M. Rayhan Zulkarnain', npm: '24781015', kelas: 'MI 4A' },
      { name: 'Muhammad Alwan Dzaky', npm: '24781016', kelas: 'MI 4A' },
      { name: 'Nabila Alfi Nur Khasanah', npm: '24781017', kelas: 'MI 4A' },
      { name: 'Nadiya Ghefira El Firsi', npm: '24781018', kelas: 'MI 4A' },
      { name: 'Nayla Putri Syafira Arrovi', npm: '24781019', kelas: 'MI 4A' },
      { name: 'Nyken Sekar Ayuningtyas', npm: '24781020', kelas: 'MI 4A' },
      { name: 'Rafi Diandra Ardi Agusta', npm: '24781021', kelas: 'MI 4A' },
      { name: 'Rendy Dwi Prayoga', npm: '24781022', kelas: 'MI 4A' },
      { name: 'Rifki Rangga Saputra', npm: '24781023', kelas: 'MI 4A' },
      { name: 'Rizki Surohman', npm: '24781024', kelas: 'MI 4A' },
      { name: 'Rubby Ibnu Anantara', npm: '24781025', kelas: 'MI 4A' },
      { name: 'Septi Cahyaningtias', npm: '24781026', kelas: 'MI 4A' },
      { name: 'Sofi Ramadhani', npm: '24781027', kelas: 'MI 4A' },
      { name: 'Tasya Rismala', npm: '24781028', kelas: 'MI 4A' },
      { name: 'Ulfa Setyaningsih', npm: '24781029', kelas: 'MI 4A' },
      { name: 'Yoga Ricky Pasaribu', npm: '24781030', kelas: 'MI 4A' },
      { name: 'Yusuf Al Fikri Jayasena', npm: '24781031', kelas: 'MI 4A' },
      // ===== MI 4B =====
      { name: 'Dina Aulia Nursabita', npm: '23753095', kelas: 'MI 4B' },
      { name: 'Adi Putra Cahya Gumilang', npm: '24781032', kelas: 'MI 4B' },
      { name: 'Aidil Yosef', npm: '24781033', kelas: 'MI 4B' },
      { name: 'Arfandy Jhuliansyah', npm: '24781034', kelas: 'MI 4B' },
      { name: 'Desty Angelina', npm: '24781038', kelas: 'MI 4B' },
      { name: 'Egi Rivaldi', npm: '24781039', kelas: 'MI 4B' },
      { name: 'Fajri Kurniawan', npm: '24781040', kelas: 'MI 4B' },
      { name: 'Faris Alfarezi Riatmoko', npm: '24781041', kelas: 'MI 4B' },
      { name: 'Frans Yuda Rizki Pramudya', npm: '24781042', kelas: 'MI 4B' },
      { name: 'Ilham Kurniawan Rizki', npm: '24781043', kelas: 'MI 4B' },
      { name: 'Jonatan Danang Eka Saputra Turnip', npm: '24781044', kelas: 'MI 4B' },
      { name: 'M. Berlian Syasmita', npm: '24781045', kelas: 'MI 4B' },
      { name: 'Muhammad Farid Al Ikhsan', npm: '24781047', kelas: 'MI 4B' },
      { name: 'Nabila Rizky Ilahi', npm: '24781048', kelas: 'MI 4B' },
      { name: 'Naifah Aini Zahra', npm: '24781049', kelas: 'MI 4B' },
      { name: 'Nofidyandra Sitorus', npm: '24781050', kelas: 'MI 4B' },
      { name: 'Orlean Wonkly Khatulistiwa', npm: '24781051', kelas: 'MI 4B' },
      { name: 'Rangga Hazirathul Qudsiah', npm: '24781052', kelas: 'MI 4B' },
      { name: 'Reza Fahmi Alkhamdani', npm: '24781053', kelas: 'MI 4B' },
      { name: 'Ririn Agustina', npm: '24781054', kelas: 'MI 4B' },
      { name: 'Salsa Dwi Avrillia', npm: '24781056', kelas: 'MI 4B' },
      { name: 'Shakinah Zulayni', npm: '24781057', kelas: 'MI 4B' },
      { name: 'Sri Panenti Viditona Lubis', npm: '24781058', kelas: 'MI 4B' },
      { name: 'Tego Saputra', npm: '24781059', kelas: 'MI 4B' },
      { name: 'Umi Khoirullatifah', npm: '24781060', kelas: 'MI 4B' },
      // ===== MI 4C =====
      { name: 'Affan Fazle Mawla', npm: '24781063', kelas: 'MI 4C' },
      { name: 'Az Zahra Juas Dinda Dinata', npm: '24781066', kelas: 'MI 4C' },
      { name: 'Citra Zainah Az-Zahra', npm: '24781067', kelas: 'MI 4C' },
      { name: 'Dede Aulya Ramadhan', npm: '24781068', kelas: 'MI 4C' },
      { name: 'Devnis Arga Vanis Setiawan', npm: '24781069', kelas: 'MI 4C' },
      { name: 'Eka Nursani', npm: '24781070', kelas: 'MI 4C' },
      { name: 'Fatir Kausar', npm: '24781072', kelas: 'MI 4C' },
      { name: 'Gilang Ardyan Wijaya', npm: '24781073', kelas: 'MI 4C' },
      { name: 'Imarotul Hafidzoh', npm: '24781074', kelas: 'MI 4C' },
      { name: 'M.Chaesar Abdullah', npm: '24781076', kelas: 'MI 4C' },
      { name: 'Muhammad Putara Meca Abzanro', npm: '24781078', kelas: 'MI 4C' },
      { name: 'Nabila Ramadhani', npm: '24781079', kelas: 'MI 4C' },
      { name: 'Nandito Prabu Pratama', npm: '24781080', kelas: 'MI 4C' },
      { name: 'Nur Aziza', npm: '24781081', kelas: 'MI 4C' },
      { name: 'Putri Sari Rizkiyah', npm: '24781082', kelas: 'MI 4C' },
      { name: 'Rasyida Messy Hidayat', npm: '24781083', kelas: 'MI 4C' },
      { name: 'Riani Azzahra Saridewi', npm: '24781084', kelas: 'MI 4C' },
      { name: 'Rizqi Akbar', npm: '24781086', kelas: 'MI 4C' },
      { name: 'Sania Karima', npm: '24781087', kelas: 'MI 4C' },
      { name: 'Shofiyyah Nabila Putri', npm: '24781088', kelas: 'MI 4C' },
      { name: 'Yuda Aditya Putra', npm: '24781092', kelas: 'MI 4C' },
      // ===== MI 4D =====
      { name: 'Ahmad Muhajir', npm: '24781093', kelas: 'MI 4D' },
      { name: 'Alya Alfi Lutfiah', npm: '24781094', kelas: 'MI 4D' },
      { name: 'Atha Talitha Nabil', npm: '24781095', kelas: 'MI 4D' },
      { name: 'Cosmas Septiano', npm: '24781097', kelas: 'MI 4D' },
      { name: 'Dewi Rahma Agustina', npm: '24781099', kelas: 'MI 4D' },
      { name: 'Elya Dianis', npm: '24781100', kelas: 'MI 4D' },
      { name: 'Farah Sulistia', npm: '24781101', kelas: 'MI 4D' },
      { name: 'Fiqa Khairunisa', npm: '24781102', kelas: 'MI 4D' },
      { name: 'Govin Gautama', npm: '24781103', kelas: 'MI 4D' },
      { name: 'Jeni Amanda', npm: '24781104', kelas: 'MI 4D' },
      { name: 'Kurnia Wati Fadhilah', npm: '24781105', kelas: 'MI 4D' },
      { name: 'M. Haidir Septian', npm: '24781106', kelas: 'MI 4D' },
      { name: 'Muhammad Akbar Husni Harun', npm: '24781107', kelas: 'MI 4D' },
      { name: 'Musa Mushthofaynal Abror Almishry A', npm: '24781108', kelas: 'MI 4D' },
      { name: 'Nadina Putri Khairani', npm: '24781109', kelas: 'MI 4D' },
      { name: 'Nandy Thaher Ulga', npm: '24781110', kelas: 'MI 4D' },
      { name: 'Nurul Aliya', npm: '24781111', kelas: 'MI 4D' },
      { name: 'Raffi Ramadhan Oktaviansyah', npm: '24781112', kelas: 'MI 4D' },
      { name: 'Refha Ardinata M.Noer', npm: '24781113', kelas: 'MI 4D' },
      { name: 'Riski Amalia', npm: '24781115', kelas: 'MI 4D' },
      { name: 'Sarifah Elizabeth Simamora', npm: '24781116', kelas: 'MI 4D' },
      { name: 'Silvia Nanda Agustin', npm: '24781117', kelas: 'MI 4D' },
      { name: 'Tri Rizki Amelia', npm: '24781119', kelas: 'MI 4D' },
      { name: 'Yayuk Febriat Praba', npm: '24781120', kelas: 'MI 4D' },
      { name: 'Ahmad Aslamsyah Attoria', npm: '24781122', kelas: 'MI 4D' }
    ];

    for (const student of students) {
      const hashedPw = await bcrypt.hash(student.npm, 10);
      await prisma.user.create({
        data: {
          username: student.name,
          password: hashedPw,
          name: student.name,
          npm: student.npm,
          kelas: student.kelas,
          role: 'MAHASISWA'
        }
      });
    }

    res.json({
      message: `Seed berhasil! Dibuat: 2 admin (TIMDIS1, TIMDIS2) + ${students.length} mahasiswa dari 4 kelas.`,
      detail: {
        admins: 2,
        mahasiswa: students.length,
        kelas: ['MI 4A (31)', 'MI 4B (25)', 'MI 4C (21)', 'MI 4D (25)']
      }
    });
  } catch (error) {
    console.error('[SEED ERROR]', error);
    res.status(500).json({ error: 'Seed gagal: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server Smart Attendance berjalan di http://localhost:${PORT}`);
});
