const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');
const { getDistance, getClientIP } = require('../utils/helpers');

// =============================================
// ATTENDANCE — ABSEN APEL (dengan Anti-Fake GPS)
// =============================================

const activeRequests = new Set();

router.post(
  "/api/attendance/apel",
  authMiddleware,
  async (req, res) => {
    if (activeRequests.has(req.user.id)) {
      return res.status(429).json({ success: false, message: "Permintaan Anda sedang diproses, harap tunggu." });
    }
    activeRequests.add(req.user.id);
    try {
      const {
        latitude,
        longitude,
        alamat_lokasi,
        device_info,
        accuracy,
        gps_timestamp,
        browser,
        platform,
      } = req.body;
      if (latitude === undefined || latitude === null || longitude === undefined || longitude === null || accuracy === undefined || accuracy === null) {
        return res.status(400).json({ success: false, message: "Koordinat atau akurasi tidak lengkap. Pastikan GPS aktif." });
      }

      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const acc = parseFloat(accuracy);
      const gpsTs = gps_timestamp ? parseFloat(gps_timestamp) : null;

      if (isNaN(lat) || isNaN(lon) || isNaN(acc)) {
        return res.status(400).json({ success: false, message: "Format koordinat atau akurasi tidak valid." });
      }

      if (acc > 100) {
        return res.status(400).json({ success: false, message: "Akurasi GPS terlalu rendah. Silakan aktifkan GPS akurasi tinggi." });
      }

      // Cek jadwal aktif
      const nowTime = new Date();
      const activeJadwal = await prisma.jadwalApel.findFirst({
        where: {
          is_active: true,
          waktu_mulai: { lte: nowTime },
          waktu_selesai: { gte: nowTime }
        }
      });

      if (!activeJadwal) {
        return res.status(400).json({ success: false, message: "Belum ada jadwal apel yang aktif saat ini." });
      }

      // Cek sudah absen hari ini untuk jadwal ini
      const existing = await prisma.attendance.findFirst({
        where: {
          userId: req.user.id,
          jadwalId: activeJadwal.id
        },
      });

      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Anda sudah melakukan absen untuk jadwal apel ini." });
      }

      if (!req.body.foto_selfie) {
        return res.status(400).json({ success: false, message: "Foto selfie wajib disertakan" });
      }

      const fotoPath = req.body.foto_selfie; // Base64 string from frontend
      const isLate = nowTime > (activeJadwal.batas_terlambat || activeJadwal.waktu_mulai);
      const clientIP = getClientIP(req);

      const activeLocation = await prisma.lokasiAbsen.findFirst({
        where: { is_active: true }
      });

      if (!activeLocation || activeLocation.latitude == null || activeLocation.longitude == null || activeLocation.radius_meter == null) {
         return res.status(400).json({ success: false, message: "Lokasi aktif admin belum dipilih atau tidak valid." });
      }

      const adminLat = parseFloat(activeLocation.latitude);
      const adminLon = parseFloat(activeLocation.longitude);
      const adminRadius = parseFloat(activeLocation.radius_meter);

      if (isNaN(adminLat) || isNaN(adminLon) || isNaN(adminRadius)) {
        return res.status(400).json({ success: false, message: "Koordinat lokasi aktif admin tidak valid." });
      }

      // Hitung jarak menggunakan Haversine
      const distance = getDistance(lat, lon, adminLat, adminLon);
      const roundedDistance = Math.round(distance);

      // --- LOGGING ---
      console.log(`[ABSENSI] User ID: ${req.user.id}`);
      console.log(`[ABSENSI] Lokasi User: Lat ${lat}, Lon ${lon}, Acc ±${acc}m`);
      console.log(`[ABSENSI] Lokasi Admin: ${activeLocation.nama_lokasi} (Lat ${adminLat}, Lon ${adminLon}, Radius ${adminRadius}m)`);
      console.log(`[ABSENSI] Jarak Terhitung: ${roundedDistance} meter`);

      if (distance > adminRadius) {
         console.log(`[ABSENSI] DITOLAK - Jarak melebihi radius.`);
         return res.status(400).json({ 
           success: false, 
           message: "Anda berada di luar area lokasi apel.",
           distance: roundedDistance,
           allowedRadius: adminRadius
         });
      }

      console.log(`[ABSENSI] DITERIMA - Insert ke database.`);

      const status = isLate ? "TERLAMBAT" : "HADIR";

      const attendance = await prisma.attendance.create({
        data: {
          userId: req.user.id,
          jadwalId: activeJadwal.id,
          jam_absen: new Date(), // Waktu server, BUKAN waktu device
          status,
          latitude: lat,
          longitude: lon,
          alamat_lokasi: alamat_lokasi || null,
          device_info: device_info || null,
          ip_address: clientIP,
          foto_selfie: fotoPath,
          // === Anti-Fake GPS Fields ===
          accuracy: acc,
          gps_timestamp: gpsTs,
          jarak_dari_titik: parseFloat(distance.toFixed(2)),
          browser: browser || null,
          platform: platform || null,
          nama_lokasi_aktif: activeLocation.nama_lokasi,
        },
      });

      res.json({ 
        success: true, 
        message: "Absen apel berhasil.", 
        distance: roundedDistance, 
        allowedRadius: adminRadius,
        ...attendance, 
        status 
      });
    } catch (error) {
      console.error("[ATTENDANCE ERROR]", error);
      res.status(500).json({ error: "Server error" });
    } finally {
      activeRequests.delete(req.user.id);
    }
  },
);

// =============================================
// ATTENDANCE — GET (list absensi)
// =============================================

router.get("/api/attendance", authMiddleware, async (req, res) => {
  try {
    const filters = {};

    if (req.user.role !== "ADMIN") {
      // Mahasiswa hanya lihat absensi dirinya sendiri
      filters.userId = req.user.id;
    } else {
      // Admin filter by kelas
      if (req.query.kelas && req.query.kelas !== "Semua Kelas") {
        filters.user = { kelas: req.query.kelas };
      }
    }

    const records = await prisma.attendance.findMany({
      where: filters,
      include: {
        user: {
          select: { name: true, username: true, kelas: true, npm: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.json(records);
  } catch (error) {
    console.error("[GET ATTENDANCE ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

// =============================================
// ATTENDANCE — DELETE (Admin Only)
// =============================================

router.delete(
  "/api/attendance/:id",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.attendance.delete({ where: { id_absensi: parseInt(id) } });
      res.json({ message: "Data absensi berhasil dihapus" });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

// =============================================
// ATTENDANCE — STATS (Admin Only)
// =============================================

router.get(
  "/api/attendance/stats",
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      // Gunakan tengah malam WIB (UTC+7) sebagai awal hari — bukan UTC midnight
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      // Offset WIB: kurangi 7 jam untuk mendapat batas UTC yang sesuai
      today.setTime(today.getTime() - (7 * 60 * 60 * 1000));

      const todayAttendances = await prisma.attendance.findMany({
        where: { tanggal: { gte: today } },
        include: { user: { select: { kelas: true } } },
      });

      const totalToday = todayAttendances.length;
      const hadir = todayAttendances.filter((a) => a.status === "HADIR").length;
      const terlambat = todayAttendances.filter(
        (a) => a.status === "TERLAMBAT",
      ).length;

      const byKelas = {};
      const classes = ["MI 4A", "MI 4B", "MI 4C", "MI 4D"];
      for (const kelas of classes) {
        byKelas[kelas] = todayAttendances.filter(
          (a) => a.user.kelas === kelas,
        ).length;
      }

      res.json({
        totalToday,
        hadir,
        terlambat,
        byKelas,
      });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
