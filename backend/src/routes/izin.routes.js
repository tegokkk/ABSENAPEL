const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

const ALLOWED_JENIS_IZIN = new Set(["SAKIT", "IZIN", "CUTI"]);
const ALLOWED_STATUS_IZIN = new Set(["PENDING", "APPROVED", "REJECTED"]);

// =============================================
// PENGAJUAN IZIN — CRUD
// =============================================
router.post("/api/izin", authMiddleware, async (req, res) => {
  try {
    const { tanggal_awal, tanggal_akhir, jenis_izin, keterangan, lampiran_url } = req.body;
    const start = new Date(tanggal_awal);
    const end = new Date(tanggal_akhir);
    const jenis = String(jenis_izin || "").toUpperCase();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ error: "Tanggal izin tidak valid" });
    }
    if (end < start) {
      return res.status(400).json({ error: "Tanggal akhir izin tidak boleh sebelum tanggal awal" });
    }
    if (!ALLOWED_JENIS_IZIN.has(jenis)) {
      return res.status(400).json({ error: "Jenis izin tidak valid" });
    }
    if (!keterangan || !keterangan.trim()) {
      return res.status(400).json({ error: "Keterangan izin wajib diisi" });
    }

    const data = await prisma.pengajuanIzin.create({
      data: {
        userId: req.user.id,
        tanggal_awal: start,
        tanggal_akhir: end,
        jenis_izin: jenis,
        keterangan: keterangan.trim(),
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
    const nextStatus = String(status || "").toUpperCase();
    if (!ALLOWED_STATUS_IZIN.has(nextStatus) || nextStatus === "PENDING") {
      return res.status(400).json({ error: "Status izin tidak valid" });
    }

    const data = await prisma.pengajuanIzin.update({
      where: { id: parseInt(id) },
      data: { status: nextStatus, approved_by: req.user.id }
    });
    res.json({ message: `Izin di-${nextStatus.toLowerCase()}`, data });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/api/izin/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.pengajuanIzin.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return res.status(404).json({ error: "Data izin tidak ditemukan" });
    }
    await prisma.pengajuanIzin.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Data izin berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
