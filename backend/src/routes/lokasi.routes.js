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

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = radius_meter ? parseFloat(radius_meter) : 100;

    if (isNaN(lat) || isNaN(lon) || isNaN(radius) || radius <= 0) {
      return res.status(400).json({ error: "Koordinat atau radius lokasi tidak valid" });
    }

    const location = await prisma.$transaction(async (tx) => {
      const created = await tx.lokasiAbsen.create({
        data: {
          nama_lokasi: nama_lokasi.trim(),
          latitude: lat,
          longitude: lon,
          radius_meter: radius,
        },
      });

      const count = await tx.lokasiAbsen.count();
      if (count === 1) {
        return tx.lokasiAbsen.update({
          where: { id: created.id },
          data: { is_active: true },
        });
      }

      return created;
    });

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

    if (
      (updateData.latitude !== undefined && isNaN(updateData.latitude)) ||
      (updateData.longitude !== undefined && isNaN(updateData.longitude)) ||
      (updateData.radius_meter !== undefined && (isNaN(updateData.radius_meter) || updateData.radius_meter <= 0))
    ) {
      return res.status(400).json({ error: "Koordinat atau radius lokasi tidak valid" });
    }

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

    await prisma.$transaction(async (tx) => {
      await tx.lokasiAbsen.delete({ where: { id: parseInt(id) } });

      if (existing.is_active) {
        const replacement = await tx.lokasiAbsen.findFirst({
          orderBy: [{ is_default: "desc" }, { id: "asc" }],
        });
        if (replacement) {
          await tx.lokasiAbsen.update({
            where: { id: replacement.id },
            data: { is_active: true },
          });
        }
      }
    });

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

    await prisma.$transaction(async (tx) => {
      await tx.lokasiAbsen.updateMany({
        where: { is_active: true },
        data: { is_active: false },
      });

      await tx.lokasiAbsen.update({
        where: { id: parseInt(id) },
        data: { is_active: true },
      });
    });

    res.json({ message: `Lokasi "${existing.nama_lokasi}" diaktifkan` });
  } catch (error) {
    console.error("[LOKASI ACTIVATE ERROR]", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
