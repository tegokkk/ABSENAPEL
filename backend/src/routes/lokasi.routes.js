const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

// =============================================
// LOKASI ABSEN — CRUD (Admin Only)
// =============================================

// GET semua lokasi
router.get("/api/lokasi", authMiddleware, async (req, res) => {
  try {
    const locations = await prisma.lokasiAbsen.findMany({
      orderBy: [{ is_default: "desc" }, { nama_lokasi: "asc" }],
    });
    res.json(locations);
  } catch (error) {
    console.error("[LOKASI LIST ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

// POST tambah lokasi baru
router.post("/api/lokasi", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama_lokasi, latitude, longitude, radius_meter } = req.body;

    if (!nama_lokasi || latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ error: "Nama lokasi, latitude, dan longitude wajib diisi" });
    }

    const location = await prisma.lokasiAbsen.create({
      data: {
        nama_lokasi: nama_lokasi.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius_meter: radius_meter ? parseFloat(radius_meter) : 100,
      },
    });

    // Jika ini lokasi pertama, jadikan aktif
    const count = await prisma.lokasiAbsen.count();
    if (count === 1) {
      await prisma.lokasiAbsen.update({
        where: { id: location.id },
        data: { is_active: true },
      });
      location.is_active = true;
    }

    res.status(201).json({
      message: "Lokasi berhasil ditambahkan",
      location,
    });
  } catch (error) {
    console.error("[LOKASI CREATE ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT edit lokasi
router.put("/api/lokasi/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_lokasi, latitude, longitude, radius_meter } = req.body;

    const existing = await prisma.lokasiAbsen.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: "Lokasi tidak ditemukan" });
    }

    const updateData = {};
    if (nama_lokasi) updateData.nama_lokasi = nama_lokasi.trim();
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (radius_meter !== undefined) updateData.radius_meter = parseFloat(radius_meter);

    const location = await prisma.lokasiAbsen.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ message: "Lokasi berhasil diperbarui", location });
  } catch (error) {
    console.error("[LOKASI UPDATE ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE hapus lokasi (tidak bisa hapus lokasi default)
router.delete("/api/lokasi/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.lokasiAbsen.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: "Lokasi tidak ditemukan" });
    }
    if (existing.is_default) {
      return res
        .status(400)
        .json({ error: "Lokasi default tidak dapat dihapus" });
    }

    await prisma.lokasiAbsen.delete({ where: { id: parseInt(id) } });

    // Jika yang dihapus adalah lokasi aktif, aktifkan lokasi default atau lokasi pertama
    if (existing.is_active) {
      const defaultLoc = await prisma.lokasiAbsen.findFirst({
        where: { is_default: true },
      });
      if (defaultLoc) {
        await prisma.lokasiAbsen.update({
          where: { id: defaultLoc.id },
          data: { is_active: true },
        });
      } else {
        const firstLoc = await prisma.lokasiAbsen.findFirst();
        if (firstLoc) {
          await prisma.lokasiAbsen.update({
            where: { id: firstLoc.id },
            data: { is_active: true },
          });
        }
      }
    }

    res.json({ message: "Lokasi berhasil dihapus" });
  } catch (error) {
    console.error("[LOKASI DELETE ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT aktifkan lokasi (nonaktifkan yang lain)
router.put("/api/lokasi/:id/activate", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.lokasiAbsen.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existing) {
      return res.status(404).json({ error: "Lokasi tidak ditemukan" });
    }

    // Nonaktifkan semua lokasi
    await prisma.lokasiAbsen.updateMany({
      where: { is_active: true },
      data: { is_active: false },
    });

    // Aktifkan lokasi yang dipilih
    await prisma.lokasiAbsen.update({
      where: { id: parseInt(id) },
      data: { is_active: true },
    });

    res.json({ message: `Lokasi "${existing.nama_lokasi}" diaktifkan` });
  } catch (error) {
    console.error("[LOKASI ACTIVATE ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
