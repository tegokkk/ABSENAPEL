const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

const parseRequiredDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const validateScheduleRange = (start, lateLimit, end) => {
  if (!start || !end) return "Waktu mulai dan waktu selesai wajib diisi dengan format valid";
  if (end <= start) return "Waktu selesai harus lebih besar dari waktu mulai";
  if (lateLimit && (lateLimit < start || lateLimit > end)) {
    return "Batas terlambat harus berada di antara waktu mulai dan waktu selesai";
  }
  return null;
};

const hasOverlappingActiveSchedule = async ({ start, end, excludeId }) => {
  const overlap = await prisma.jadwalApel.findFirst({
    where: {
      is_active: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      waktu_mulai: { lt: end },
      waktu_selesai: { gt: start },
    },
  });
  return !!overlap;
};

// =============================================
// JADWAL APEL — CRUD (Admin Only)
// =============================================
router.get("/api/jadwal", authMiddleware, async (req, res) => {
  try {
    const data = await prisma.jadwalApel.findMany({ orderBy: { waktu_mulai: "desc" } });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/api/jadwal", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_kegiatan, waktu_mulai, batas_terlambat, waktu_selesai, deskripsi, is_active } = req.body;
    const start = parseRequiredDate(waktu_mulai);
    const lateLimit = batas_terlambat ? parseRequiredDate(batas_terlambat) : null;
    const end = parseRequiredDate(waktu_selesai);
    const rangeError = validateScheduleRange(start, lateLimit, end);
    if (!nama_kegiatan || rangeError) {
      return res.status(400).json({ error: rangeError || "Nama kegiatan wajib diisi" });
    }
    if ((is_active ?? true) && await hasOverlappingActiveSchedule({ start, end })) {
      return res.status(400).json({ error: "Jadwal aktif tidak boleh tumpang tindih dengan jadwal aktif lain" });
    }

    const data = await prisma.jadwalApel.create({
      data: {
        nama_kegiatan: nama_kegiatan.trim(),
        waktu_mulai: start,
        batas_terlambat: lateLimit,
        waktu_selesai: end,
        deskripsi,
        is_active: is_active ?? true
      }
    });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/api/jadwal/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kegiatan, waktu_mulai, batas_terlambat, waktu_selesai, deskripsi, is_active } = req.body;
    const scheduleId = parseInt(id);
    const existing = await prisma.jadwalApel.findUnique({ where: { id: scheduleId } });
    if (!existing) return res.status(404).json({ error: "Jadwal tidak ditemukan" });

    const updateData = {};
    if (nama_kegiatan) updateData.nama_kegiatan = nama_kegiatan.trim();
    if (waktu_mulai) updateData.waktu_mulai = parseRequiredDate(waktu_mulai);
    if (batas_terlambat !== undefined) updateData.batas_terlambat = batas_terlambat ? parseRequiredDate(batas_terlambat) : null;
    if (waktu_selesai) updateData.waktu_selesai = parseRequiredDate(waktu_selesai);
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (is_active !== undefined) updateData.is_active = is_active;

    const nextStart = updateData.waktu_mulai || existing.waktu_mulai;
    const nextLateLimit = updateData.batas_terlambat !== undefined ? updateData.batas_terlambat : existing.batas_terlambat;
    const nextEnd = updateData.waktu_selesai || existing.waktu_selesai;
    const rangeError = validateScheduleRange(nextStart, nextLateLimit, nextEnd);
    if (rangeError) return res.status(400).json({ error: rangeError });
    if ((updateData.is_active ?? existing.is_active) && await hasOverlappingActiveSchedule({ start: nextStart, end: nextEnd, excludeId: scheduleId })) {
      return res.status(400).json({ error: "Jadwal aktif tidak boleh tumpang tindih dengan jadwal aktif lain" });
    }

    const data = await prisma.jadwalApel.update({
      where: { id: scheduleId },
      data: updateData
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api/jadwal/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.jadwalApel.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Jadwal Apel dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
