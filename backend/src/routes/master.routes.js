const express = require("express");
const router = express.Router();
const prisma = require("../utils/prisma");
const { authMiddleware, adminOnly } = require("../middlewares/auth");

// =============================================
// MASTER DATA AKADEMIK - CRUD
// =============================================

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const sendMasterError = (res, error, fallback = "Server error") => {
  if (error.code === "P2002") {
    return res.status(409).json({ error: "Data dengan nama tersebut sudah ada" });
  }
  if (error.code === "P2003") {
    return res.status(400).json({ error: "Data relasi tidak valid atau masih dipakai" });
  }
  if (error.code === "P2025") {
    return res.status(404).json({ error: "Data tidak ditemukan" });
  }
  return res.status(500).json({ error: fallback });
};

// --- JURUSAN ---
router.get("/api/jurusan", authMiddleware, async (req, res) => {
  try {
    const data = await prisma.jurusan.findMany({
      include: { programStudi: true },
      orderBy: { nama: "asc" },
    });
    res.json(data);
  } catch (error) {
    sendMasterError(res, error);
  }
});

router.post("/api/jurusan", authMiddleware, adminOnly, async (req, res) => {
  try {
    const nama = cleanText(req.body.nama);
    const singkatan = cleanText(req.body.singkatan) || null;
    if (!nama) return res.status(400).json({ error: "Nama jurusan wajib diisi" });

    const data = await prisma.jurusan.create({ data: { nama, singkatan } });
    res.status(201).json(data);
  } catch (error) {
    sendMasterError(res, error);
  }
});

router.put("/api/jurusan/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: "ID jurusan tidak valid" });

    const nama = cleanText(req.body.nama);
    const singkatan = cleanText(req.body.singkatan) || null;
    if (!nama) return res.status(400).json({ error: "Nama jurusan wajib diisi" });

    const data = await prisma.jurusan.update({
      where: { id },
      data: { nama, singkatan },
    });
    res.json(data);
  } catch (error) {
    sendMasterError(res, error);
  }
});

router.delete("/api/jurusan/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: "ID jurusan tidak valid" });

    const prodiCount = await prisma.programStudi.count({ where: { jurusanId: id } });
    if (prodiCount > 0) {
      return res.status(400).json({
        error: "Jurusan masih memiliki program studi. Hapus prodi terkait terlebih dahulu.",
      });
    }

    await prisma.jurusan.delete({ where: { id } });
    res.json({ message: "Jurusan dihapus" });
  } catch (error) {
    sendMasterError(res, error);
  }
});

// --- PROGRAM STUDI ---
router.get("/api/program-studi", authMiddleware, async (req, res) => {
  try {
    const data = await prisma.programStudi.findMany({
      include: { jurusan: true, kelas: true },
      orderBy: [{ jurusan: { nama: "asc" } }, { nama: "asc" }],
    });
    res.json(data);
  } catch (error) {
    sendMasterError(res, error);
  }
});

router.post("/api/program-studi", authMiddleware, adminOnly, async (req, res) => {
  try {
    const nama = cleanText(req.body.nama);
    const jurusanId = toPositiveInt(req.body.jurusanId);
    if (!nama) return res.status(400).json({ error: "Nama prodi wajib diisi" });
    if (!jurusanId) return res.status(400).json({ error: "Jurusan wajib dipilih" });

    const data = await prisma.programStudi.create({ data: { nama, jurusanId } });
    res.status(201).json(data);
  } catch (error) {
    sendMasterError(res, error);
  }
});

router.put("/api/program-studi/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: "ID prodi tidak valid" });

    const nama = cleanText(req.body.nama);
    const jurusanId = toPositiveInt(req.body.jurusanId);
    if (!nama) return res.status(400).json({ error: "Nama prodi wajib diisi" });
    if (!jurusanId) return res.status(400).json({ error: "Jurusan wajib dipilih" });

    const data = await prisma.programStudi.update({
      where: { id },
      data: { nama, jurusanId },
    });
    res.json(data);
  } catch (error) {
    sendMasterError(res, error);
  }
});

router.delete("/api/program-studi/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: "ID prodi tidak valid" });

    const kelasCount = await prisma.kelas.count({ where: { programStudiId: id } });
    if (kelasCount > 0) {
      return res.status(400).json({
        error: "Program studi masih memiliki kelas. Hapus kelas terkait terlebih dahulu.",
      });
    }

    await prisma.programStudi.delete({ where: { id } });
    res.json({ message: "Program Studi dihapus" });
  } catch (error) {
    sendMasterError(res, error);
  }
});

// --- KELAS ---
router.get("/api/kelas", authMiddleware, async (req, res) => {
  try {
    const data = await prisma.kelas.findMany({
      include: {
        programStudi: { include: { jurusan: true } },
        _count: { select: { users: true } },
      },
      orderBy: { nama_kelas: "asc" },
    });
    res.json(data);
  } catch (error) {
    sendMasterError(res, error);
  }
});

router.post("/api/kelas", authMiddleware, adminOnly, async (req, res) => {
  try {
    const nama_kelas = cleanText(req.body.nama_kelas);
    const programStudiId = toPositiveInt(req.body.programStudiId);
    if (!nama_kelas) return res.status(400).json({ error: "Nama kelas wajib diisi" });
    if (!programStudiId) return res.status(400).json({ error: "Prodi wajib dipilih" });

    const data = await prisma.kelas.create({ data: { nama_kelas, programStudiId } });
    res.status(201).json(data);
  } catch (error) {
    sendMasterError(res, error);
  }
});

router.put("/api/kelas/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: "ID kelas tidak valid" });

    const nama_kelas = cleanText(req.body.nama_kelas);
    const programStudiId = toPositiveInt(req.body.programStudiId);
    if (!nama_kelas) return res.status(400).json({ error: "Nama kelas wajib diisi" });
    if (!programStudiId) return res.status(400).json({ error: "Prodi wajib dipilih" });

    const data = await prisma.kelas.update({
      where: { id },
      data: { nama_kelas, programStudiId },
    });
    res.json(data);
  } catch (error) {
    sendMasterError(res, error);
  }
});

router.delete("/api/kelas/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: "ID kelas tidak valid" });

    const kelas = await prisma.kelas.findUnique({ where: { id } });
    if (!kelas) return res.status(404).json({ error: "Data tidak ditemukan" });

    const userCount = await prisma.user.count({
      where: {
        OR: [
          { kelasId: id },
          { kelas: kelas.nama_kelas },
        ],
      },
    });
    if (userCount > 0) {
      return res.status(400).json({
        error: "Kelas masih dipakai mahasiswa. Pindahkan mahasiswa terlebih dahulu.",
      });
    }

    await prisma.kelas.delete({ where: { id } });
    res.json({ message: "Kelas dihapus" });
  } catch (error) {
    sendMasterError(res, error);
  }
});

module.exports = router;
