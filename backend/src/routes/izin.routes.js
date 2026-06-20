const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

// =============================================
// PENGAJUAN IZIN — CRUD
// =============================================
router.post("/api/izin", authMiddleware, async (req, res) => {
  try {
    const { tanggal_awal, tanggal_akhir, jenis_izin, keterangan, lampiran_url } = req.body;
    const data = await prisma.pengajuanIzin.create({
      data: {
        userId: req.user.id,
        tanggal_awal: new Date(tanggal_awal),
        tanggal_akhir: new Date(tanggal_akhir),
        jenis_izin,
        keterangan,
        lampiran_url
      }
    });
    res.status(201).json({ message: "Pengajuan izin berhasil dibuat", data });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/api/izin", authMiddleware, async (req, res) => {
  try {
    const filters = {};
    if (req.user.role !== "ADMIN") {
      filters.userId = req.user.id;
    }
    const data = await prisma.pengajuanIzin.findMany({
      where: filters,
      include: { user: { select: { name: true, npm: true, kelas: true } } },
      orderBy: { created_at: "desc" }
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/api/izin/:id/status", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'
    const data = await prisma.pengajuanIzin.update({
      where: { id: parseInt(id) },
      data: { status, approved_by: req.user.id }
    });
    res.json({ message: `Izin di-${status.toLowerCase()}`, data });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
