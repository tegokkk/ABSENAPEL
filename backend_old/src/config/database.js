const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/smart_attendance.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nama TEXT NOT NULL,
    email TEXT,
    nim TEXT,
    role TEXT DEFAULT 'mahasiswa' CHECK(role IN ('admin', 'mahasiswa')),
    avatar TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    nama_user TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    jam_masuk TEXT,
    jam_pulang TEXT,
    status TEXT DEFAULT 'hadir' CHECK(status IN ('hadir', 'terlambat', 'pulang_awal', 'izin', 'sakit', 'alpha')),
    latitude REAL,
    longitude REAL,
    alamat_lokasi TEXT,
    device_info TEXT,
    ip_address TEXT,
    foto_selfie TEXT,
    lat_pulang REAL,
    long_pulang REAL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_tanggal ON attendance(tanggal);
  CREATE INDEX IF NOT EXISTS idx_attendance_user_tanggal ON attendance(user_id, tanggal);
`);

// Seed default admin and sample mahasiswa
function seedData() {
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, nama, email, nim, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, 'Administrator Timdis', 'admin@kampus.ac.id', null, 'admin');
    console.log('✅ Admin default dibuat (admin / admin123)');
  }

  const mhs1Exists = db.prepare('SELECT id FROM users WHERE username = ?').get('mahasiswa1');
  if (!mhs1Exists) {
    const hashedPassword = bcrypt.hashSync('mhs123', 10);
    db.prepare(`
      INSERT INTO users (username, password, nama, email, nim, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('mahasiswa1', hashedPassword, 'Ahmad Fauzi', 'ahmad@mahasiswa.ac.id', '2024001001', 'mahasiswa');
    
    db.prepare(`
      INSERT INTO users (username, password, nama, email, nim, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('mahasiswa2', hashedPassword, 'Siti Nurhaliza', 'siti@mahasiswa.ac.id', '2024001002', 'mahasiswa');
    
    console.log('✅ Mahasiswa sample dibuat (mahasiswa1/mhs123, mahasiswa2/mhs123)');
  }
}

seedData();

module.exports = db;
