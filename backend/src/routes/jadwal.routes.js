const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

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
    const data = await prisma.jadwalApel.create({
      data: {
        nama_kegiatan,
        waktu_mulai: new Date(waktu_mulai),
        batas_terlambat: batas_terlambat ? new Date(batas_terlambat) : null,
        waktu_selesai: new Date(waktu_selesai),
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
    const updateData = {};
    if (nama_kegiatan) updateData.nama_kegiatan = nama_kegiatan;
    if (waktu_mulai) updateData.waktu_mulai = new Date(waktu_mulai);
    if (batas_terlambat !== undefined) updateData.batas_terlambat = batas_terlambat ? new Date(batas_terlambat) : null;
    if (waktu_selesai) updateData.waktu_selesai = new Date(waktu_selesai);
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (is_active !== undefined) updateData.is_active = is_active;

    const data = await prisma.jadwalApel.update({
      where: { id: parseInt(id) },
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
